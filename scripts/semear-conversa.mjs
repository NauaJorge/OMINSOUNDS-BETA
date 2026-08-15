// Cria um pedido pendente e uma conversa ja aceita, para inspecionar a caixa
// de mensagens com conteudo de verdade.
//   node --env-file=.env.local scripts/semear-conversa.mjs
import { neon } from '@neondatabase/serverless';
import { abrirPedido, responderPedido, responderNaConversa } from '../lib/mensagens.js';

const sql = neon(process.env.DATABASE_URL);
const id = async (h) => (await sql`SELECT id FROM usuarios WHERE handle = ${h}`)[0].id;

const naua = await id('naua');
const bruma = await id('bruma');
const vellox = await id('vellox');

await sql`DELETE FROM conversas WHERE solicitante_id IN (${bruma}, ${vellox}) AND destinatario_id = ${naua}`;

// pendente: BRUMA quer falar com NAUA
await abrirPedido({
  deId: bruma, paraHandle: 'naua',
  assunto: 'Licenca exclusiva do Rota 21',
  corpo: 'Fala! Curti o Rota 21, queria saber o valor da exclusiva e se ja tem alguem usando.',
});

// aceita: VELLOX e NAUA ja conversam
const c = await abrirPedido({
  deId: vellox, paraHandle: 'naua',
  assunto: 'Parceria em beat',
  corpo: 'Bora fazer um beat junto? Tenho um sample de vinil que combina com o teu drum.',
});
await responderPedido({ conversaId: c.id, usuarioId: naua, aceitar: true });
await responderNaConversa({ conversaId: c.id, usuarioId: naua, corpo: 'Fechou. Me manda o sample que eu monto a bateria por cima.' });

const [{ p }] = await sql`SELECT count(*)::int AS p FROM conversas WHERE destinatario_id = ${naua} AND situacao = 'pendente'`;
const [{ a }] = await sql`SELECT count(*)::int AS a FROM conversas WHERE destinatario_id = ${naua} AND situacao = 'aceita'`;
console.log(`caixa de @naua: ${p} pendente(s), ${a} aceita(s)`);
