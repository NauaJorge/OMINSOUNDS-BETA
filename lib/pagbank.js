import { createHash, timingSafeEqual } from 'node:crypto';
import { baseUrl } from './mercado-pago';

function apiBase() {
  return process.env.PAGBANK_ENV === 'sandbox'
    ? 'https://sandbox.api.pagseguro.com'
    : 'https://api.pagseguro.com';
}

function token() {
  const valor = process.env.PAGBANK_TOKEN;
  if (!valor) throw new Error('PAGBANK_TOKEN nao definido.');
  return valor;
}

async function pagbankFetch(path, init = {}) {
  const resposta = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) {
    const detalhe = corpo?.message || corpo?.error_messages?.[0]?.description || resposta.statusText;
    throw new Error(`PagBank ${resposta.status}: ${detalhe}`);
  }
  return corpo;
}

export async function criarCheckoutPagBank({
  pedidoId,
  titulo,
  descricao,
  valorCentavos,
}) {
  const site = baseUrl();
  const webhookUrl = `${site}/api/webhooks/pagbank`;
  const retorno = `${site}/pagamento/retorno?pedido=${pedidoId}&status=pending`;

  const checkout = await pagbankFetch('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      reference_id: `pedido:${pedidoId}`,
      customer_modifiable: true,
      items: [
        {
          reference_id: String(pedidoId),
          name: titulo.slice(0, 100),
          quantity: 1,
          unit_amount: valorCentavos,
        },
      ],
      payment_methods: [
        { type: 'PIX' },
        { type: 'CREDIT_CARD' },
        { type: 'BOLETO' },
      ],
      soft_descriptor: 'OMINSOUNDS',
      redirect_url: retorno,
      redirect_waiting_time: 5,
      return_url: retorno,
      notification_urls: [webhookUrl],
      payment_notification_urls: [webhookUrl],
    }),
  });

  const checkoutUrl = checkout.links?.find((link) => link.rel === 'PAY')?.href;
  if (!checkoutUrl) {
    throw new Error('PagBank nao retornou link PAY do checkout.');
  }

  return {
    id: checkout.id,
    checkoutUrl,
  };
}

export function validarAssinaturaPagBank({ rawBody, assinatura, webhookToken }) {
  if (!webhookToken) return true;
  if (!rawBody || !assinatura) return false;

  const calculado = createHash('sha256')
    .update(`${webhookToken}-${rawBody}`)
    .digest('hex');

  const recebido = Buffer.from(String(assinatura), 'hex');
  const esperado = Buffer.from(calculado, 'hex');
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}
