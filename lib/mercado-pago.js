import { createHmac, timingSafeEqual } from 'node:crypto';

const MP_API = 'https://api.mercadopago.com';

function accessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN nao definido.');
  }
  return token;
}

export function baseUrl() {
  const manual = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (manual) return manual.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

async function mpFetch(path, init = {}) {
  const resposta = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${accessToken()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) {
    const detalhe = corpo?.message || corpo?.error || resposta.statusText;
    throw new Error(`Mercado Pago ${resposta.status}: ${detalhe}`);
  }
  return corpo;
}

export async function criarPreferenciaMercadoPago({
  pedidoId,
  titulo,
  descricao,
  valorCentavos,
  compradorEmail,
}) {
  const site = baseUrl();
  const preference = await mpFetch('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      external_reference: `pedido:${pedidoId}`,
      notification_url: `${site}/api/webhooks/mercado-pago`,
      back_urls: {
        success: `${site}/pagamento/retorno?pedido=${pedidoId}&status=success`,
        pending: `${site}/pagamento/retorno?pedido=${pedidoId}&status=pending`,
        failure: `${site}/pagamento/retorno?pedido=${pedidoId}&status=failure`,
      },
      auto_return: 'approved',
      items: [
        {
          id: String(pedidoId),
          title: titulo,
          description: descricao,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: valorCentavos / 100,
        },
      ],
      payer: compradorEmail ? { email: compradorEmail } : undefined,
      payment_methods: {
        installments: 12,
      },
    }),
  });

  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
  const url = token.startsWith('TEST-')
    ? preference.sandbox_init_point || preference.init_point
    : preference.init_point || preference.sandbox_init_point;

  return {
    id: preference.id,
    checkoutUrl: url,
  };
}

export async function buscarPagamentoMercadoPago(paymentId) {
  return mpFetch(`/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
  });
}

function partesAssinatura(xSignature) {
  return String(xSignature || '')
    .split(',')
    .map((parte) => parte.split('='))
    .reduce((acc, [chave, valor]) => {
      if (chave && valor) acc[chave.trim()] = valor.trim();
      return acc;
    }, {});
}

export function validarAssinaturaWebhook({ xSignature, xRequestId, dataId, secret }) {
  if (!secret) return true;

  const partes = partesAssinatura(xSignature);
  if (!partes.ts || !partes.v1 || !xRequestId || !dataId) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${partes.ts};`;
  const calculado = createHmac('sha256', secret).update(manifest).digest('hex');

  const recebido = Buffer.from(partes.v1, 'hex');
  const esperado = Buffer.from(calculado, 'hex');
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}
