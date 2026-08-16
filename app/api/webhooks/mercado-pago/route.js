import { processarWebhookMercadoPago } from '../../../../lib/pagamentos';
import { validarAssinaturaWebhook } from '../../../../lib/mercado-pago';

export const dynamic = 'force-dynamic';

function extrairPaymentId(url, body) {
  return (
    body?.data?.id ||
    body?.resource?.split?.('/')?.pop?.() ||
    url.searchParams.get('data.id') ||
    url.searchParams.get('id')
  );
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const url = new URL(request.url);
  const tipo = body?.type || body?.topic || url.searchParams.get('type') || url.searchParams.get('topic');
  const paymentId = extrairPaymentId(url, body);

  if (tipo && tipo !== 'payment') {
    return Response.json({ ok: true, ignorado: tipo });
  }
  if (!paymentId) {
    return Response.json({ ok: false, erro: 'payment id ausente' }, { status: 400 });
  }

  const assinaturaValida = validarAssinaturaWebhook({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataId: url.searchParams.get('data.id') || body?.data?.id || paymentId,
    secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
  });

  if (!assinaturaValida) {
    return Response.json({ ok: false, erro: 'assinatura invalida' }, { status: 401 });
  }

  try {
    const resultado = await processarWebhookMercadoPago(paymentId);
    return Response.json(resultado);
  } catch (erro) {
    console.error('Webhook Mercado Pago falhou:', erro.message);
    return Response.json({ ok: false }, { status: 500 });
  }
}
