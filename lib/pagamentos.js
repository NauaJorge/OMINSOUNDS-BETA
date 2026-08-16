import { sql } from './db';
import { buscarPagamentoMercadoPago, criarPreferenciaMercadoPago } from './mercado-pago';
import { criarCheckoutPagBank } from './pagbank';

const STATUS_MP = {
  approved: 'aprovado',
  authorized: 'aguardando_pagamento',
  pending: 'aguardando_pagamento',
  in_process: 'aguardando_pagamento',
  in_mediation: 'aguardando_pagamento',
  rejected: 'recusado',
  cancelled: 'cancelado',
  refunded: 'cancelado',
  charged_back: 'cancelado',
};

const STATUS_PAGBANK = {
  PAID: 'aprovado',
  AUTHORIZED: 'aguardando_pagamento',
  IN_ANALYSIS: 'aguardando_pagamento',
  WAITING: 'aguardando_pagamento',
  DECLINED: 'recusado',
  CANCELED: 'cancelado',
  EXPIRED: 'expirado',
};

export function provedorPagamentoAtivo() {
  if (process.env.PAGBANK_TOKEN) return 'pagbank';
  if (process.env.MERCADO_PAGO_ACCESS_TOKEN) return 'mercado_pago';
  return '';
}

export async function criarPedidoLicenca({ usuario, licencaId }) {
  const id = Number(licencaId);
  if (!Number.isInteger(id)) throw new Error('Licenca invalida.');

  const linhas = await sql`
    SELECT l.id AS licenca_id, l.nome AS licenca, l.preco_centavos, l.formatos,
           b.id AS beat_id, b.titulo AS beat, u.id AS produtor_id, u.nome AS produtor
    FROM licencas l
    JOIN beats b ON b.id = l.beat_id
    JOIN usuarios u ON u.id = b.produtor_id
    WHERE l.id = ${id} AND b.publicado
  `;
  const licenca = linhas[0];
  if (!licenca) throw new Error('Licenca nao encontrada.');
  if (licenca.preco_centavos <= 0) throw new Error('Esta licenca nao precisa de pagamento.');

  const provedor = provedorPagamentoAtivo();
  if (!provedor) throw new Error('Nenhum provedor de pagamento configurado.');

  const descricao = `${licenca.licenca} - ${licenca.beat}`;
  const pedido = await sql`
    INSERT INTO pedidos (
      comprador_id, produtor_id, beat_id, licenca_id, tipo, descricao,
      valor_centavos, status, provedor
    )
    VALUES (
      ${usuario?.id ?? null}, ${licenca.produtor_id}, ${licenca.beat_id},
      ${licenca.licenca_id}, 'licenca', ${descricao}, ${licenca.preco_centavos},
      'rascunho', ${provedor}
    )
    RETURNING id
  `;

  const preferencia = provedor === 'pagbank'
    ? await criarCheckoutPagBank({
        pedidoId: pedido[0].id,
        titulo: descricao,
        descricao: `Licenca ${licenca.licenca} para o beat ${licenca.beat}`,
        valorCentavos: licenca.preco_centavos,
      })
    : await criarPreferenciaMercadoPago({
        pedidoId: pedido[0].id,
        titulo: descricao,
        descricao: `Licenca ${licenca.licenca} para o beat ${licenca.beat}`,
        valorCentavos: licenca.preco_centavos,
        compradorEmail: usuario?.email,
      });

  await sql`
    UPDATE pedidos
    SET status = 'aguardando_pagamento',
        provedor_preferencia_id = ${preferencia.id},
        checkout_url = ${preferencia.checkoutUrl},
        atualizado_em = now()
    WHERE id = ${pedido[0].id}
  `;

  return preferencia.checkoutUrl;
}

export function statusPedidoPagBank(status) {
  return STATUS_PAGBANK[status] || 'aguardando_pagamento';
}

export function statusPedidoMercadoPago(status) {
  return STATUS_MP[status] || 'aguardando_pagamento';
}

function resumoSeguroPagamento(pagamento) {
  return {
    id: pagamento.id,
    status: pagamento.status,
    status_detail: pagamento.status_detail,
    external_reference: pagamento.external_reference,
    payment_method_id: pagamento.payment_method_id,
    payment_type_id: pagamento.payment_type_id,
    transaction_amount: pagamento.transaction_amount,
    date_approved: pagamento.date_approved,
  };
}

export async function processarWebhookMercadoPago(paymentId) {
  const pagamento = await buscarPagamentoMercadoPago(paymentId);
  const referencia = String(pagamento.external_reference || '');
  const pedidoId = Number(referencia.replace(/^pedido:/, ''));
  if (!Number.isInteger(pedidoId)) {
    return { ok: false, motivo: 'referencia externa invalida' };
  }

  const status = statusPedidoMercadoPago(pagamento.status);
  const resumo = resumoSeguroPagamento(pagamento);

  const pedidos = await sql`
    UPDATE pedidos
    SET status = ${status},
        provedor_pagamento_id = ${String(pagamento.id)},
        metodo_pagamento = ${pagamento.payment_type_id || pagamento.payment_method_id || ''},
        payload_resumo = ${JSON.stringify(resumo)}::jsonb,
        atualizado_em = now()
    WHERE id = ${pedidoId}
    RETURNING *
  `;
  const pedido = pedidos[0];
  if (!pedido) return { ok: false, motivo: 'pedido nao encontrado' };

  await sql`
    INSERT INTO pagamento_eventos (pedido_id, provedor, evento_tipo, provedor_evento_id, payload_resumo)
    VALUES (${pedidoId}, 'mercado_pago', ${pagamento.status || 'payment'}, ${String(pagamento.id)},
            ${JSON.stringify(resumo)}::jsonb)
  `;

  if (status === 'aprovado' && pedido.tipo === 'licenca') {
    await sql`
      INSERT INTO licencas_compradas (pedido_id, comprador_id, beat_id, licenca_id, status)
      VALUES (${pedido.id}, ${pedido.comprador_id}, ${pedido.beat_id}, ${pedido.licenca_id}, 'ativa')
      ON CONFLICT (pedido_id) DO UPDATE
        SET status = EXCLUDED.status, atualizado_em = now()
    `;
  }

  return { ok: true, pedidoId, status };
}

function resumoSeguroPagBank(evento) {
  const charge = evento.charges?.[0];
  return {
    id: evento.id,
    reference_id: evento.reference_id,
    status: charge?.status || evento.status,
    charge_id: charge?.id,
    amount: charge?.amount?.value ?? evento.items?.[0]?.unit_amount,
    payment_method: charge?.payment_method?.type,
    paid_at: charge?.paid_at,
  };
}

export async function processarWebhookPagBank(evento) {
  const referencia = String(evento.reference_id || '');
  const pedidoId = Number(referencia.replace(/^pedido:/, ''));
  if (!Number.isInteger(pedidoId)) {
    return { ok: false, motivo: 'referencia externa invalida' };
  }

  const charge = evento.charges?.[0];
  const statusOriginal = charge?.status || evento.status;
  const status = statusPedidoPagBank(statusOriginal);
  const resumo = resumoSeguroPagBank(evento);

  const pedidos = await sql`
    UPDATE pedidos
    SET status = ${status},
        provedor_pagamento_id = ${charge?.id || evento.id || ''},
        metodo_pagamento = ${charge?.payment_method?.type || ''},
        payload_resumo = ${JSON.stringify(resumo)}::jsonb,
        atualizado_em = now()
    WHERE id = ${pedidoId}
    RETURNING *
  `;
  const pedido = pedidos[0];
  if (!pedido) return { ok: false, motivo: 'pedido nao encontrado' };

  await sql`
    INSERT INTO pagamento_eventos (pedido_id, provedor, evento_tipo, provedor_evento_id, payload_resumo)
    VALUES (${pedidoId}, 'pagbank', ${statusOriginal || 'checkout'}, ${String(evento.id || charge?.id || '')},
            ${JSON.stringify(resumo)}::jsonb)
  `;

  if (status === 'aprovado' && pedido.tipo === 'licenca') {
    await sql`
      INSERT INTO licencas_compradas (pedido_id, comprador_id, beat_id, licenca_id, status)
      VALUES (${pedido.id}, ${pedido.comprador_id}, ${pedido.beat_id}, ${pedido.licenca_id}, 'ativa')
      ON CONFLICT (pedido_id) DO UPDATE
        SET status = EXCLUDED.status, atualizado_em = now()
    `;
  }

  return { ok: true, pedidoId, status };
}
