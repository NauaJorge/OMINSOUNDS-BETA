import { processarWebhookPagBank } from '../../../../lib/pagamentos';
import { validarAssinaturaPagBank } from '../../../../lib/pagbank';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const rawBody = await request.text();
  let body = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return Response.json({ ok: false, erro: 'json invalido' }, { status: 400 });
  }

  const assinaturaValida = validarAssinaturaPagBank({
    rawBody,
    assinatura: request.headers.get('x-authenticity-token'),
    webhookToken: process.env.PAGBANK_WEBHOOK_TOKEN,
  });

  if (!assinaturaValida) {
    return Response.json({ ok: false, erro: 'assinatura invalida' }, { status: 401 });
  }

  try {
    const resultado = await processarWebhookPagBank(body);
    return Response.json(resultado);
  } catch (erro) {
    console.error('Webhook PagBank falhou:', erro.message);
    return Response.json({ ok: false }, { status: 500 });
  }
}
