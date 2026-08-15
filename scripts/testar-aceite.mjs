// Prova que o aceite realmente retem o conteudo, na camada de consulta.
//   node --env-file=.env.local scripts/testar-aceite.mjs
import { neon } from '@neondatabase/serverless';
import {
  abrirPedido, pedidosPendentes, mensagensDaConversa,
  responderPedido, conversasAceitas,
} from '../lib/mensagens.js';

const sql = neon(process.env.DATABASE_URL);
let falhas = 0;

function ok(condicao, descricao) {
  console.log(`${condicao ? '  ok  ' : ' FALHA'}  ${descricao}`);
  if (!condicao) falhas++;
}

const SEGREDO = 'CONTEUDO-SECRETO-QUE-NAO-PODE-VAZAR-' + Date.now();

async function rodar() {
  const [bruma] = await sql`SELECT id FROM usuarios WHERE handle = 'bruma'`;
  const [vellox] = await sql`SELECT id FROM usuarios WHERE handle = 'vellox'`;
  const [naua] = await sql`SELECT id FROM usuarios WHERE handle = 'naua'`;

  // Limpa execucoes anteriores para o teste ser repetivel.
  await sql`DELETE FROM conversas WHERE solicitante_id = ${bruma.id} AND destinatario_id = ${vellox.id}`;

  console.log('\n1. BRUMA manda pedido para VELLOX');
  const criado = await abrirPedido({
    deId: bruma.id, paraHandle: 'vellox',
    assunto: 'ASSUNTO-SECRETO', corpo: SEGREDO,
  });
  ok(criado.ok === true, 'pedido criado');

  console.log('\n2. VELLOX olha a caixa ANTES de aceitar');
  const pendentes = await pedidosPendentes(vellox.id);
  const alvo = pendentes.find((p) => p.id === criado.id);
  ok(!!alvo, 'o pedido aparece na caixa de VELLOX');
  ok(alvo.handle === 'bruma', 'VELLOX ve QUEM pediu');
  ok(!!alvo.criado_em, 'VELLOX ve QUANDO pediu');

  const serializado = JSON.stringify(pendentes);
  ok(!serializado.includes(SEGREDO), 'o CORPO nao esta em lugar nenhum do resultado');
  ok(!serializado.includes('ASSUNTO-SECRETO'), 'o ASSUNTO tambem nao vaza');
  ok(!('corpo' in alvo), 'nao existe nem o campo corpo no objeto');

  console.log('\n3. VELLOX tenta abrir a conversa direto pelo id, sem aceitar');
  const tentativa = await mensagensDaConversa(criado.id, vellox.id);
  ok(tentativa === null, 'a consulta recusa: devolve null, nao o conteudo');

  console.log('\n4. NAUA, que nao tem nada a ver, tenta abrir a mesma conversa');
  const bisbilhoteiro = await mensagensDaConversa(criado.id, naua.id);
  ok(bisbilhoteiro === null, 'terceiro nao alcanca a conversa');

  console.log('\n5. VELLOX aceita');
  const aceitou = await responderPedido({ conversaId: criado.id, usuarioId: vellox.id, aceitar: true });
  ok(aceitou === true, 'aceite registrado');

  const depois = await mensagensDaConversa(criado.id, vellox.id);
  ok(depois !== null, 'agora a conversa abre');
  ok(depois.mensagens[0].corpo === SEGREDO, 'e o corpo aparece, inteiro');

  const listaVellox = await conversasAceitas(vellox.id);
  ok(listaVellox.some((c) => c.id === criado.id), 'a conversa entra na lista de aceitas');

  console.log('\n6. NAUA tenta de novo, agora que a conversa esta aceita');
  const aindaNao = await mensagensDaConversa(criado.id, naua.id);
  ok(aindaNao === null, 'terceiro continua sem acesso');

  console.log('\n7. Quem ja foi recusado nao consegue insistir');
  await sql`DELETE FROM conversas WHERE solicitante_id = ${naua.id} AND destinatario_id = ${vellox.id}`;
  const p2 = await abrirPedido({ deId: naua.id, paraHandle: 'vellox', assunto: '', corpo: 'oi' });
  await responderPedido({ conversaId: p2.id, usuarioId: vellox.id, aceitar: false });
  const reenvio = await abrirPedido({ deId: naua.id, paraHandle: 'vellox', assunto: '', corpo: 'oi de novo' });
  ok(!!reenvio.erro, 'reenvio apos recusa e barrado: ' + reenvio.erro);

  console.log('\n8. Nao da para responder pedido dos outros');
  await sql`DELETE FROM conversas WHERE solicitante_id = ${bruma.id} AND destinatario_id = ${naua.id}`;
  const p3 = await abrirPedido({ deId: bruma.id, paraHandle: 'naua', assunto: '', corpo: 'x' });
  const invasor = await responderPedido({ conversaId: p3.id, usuarioId: vellox.id, aceitar: true });
  ok(invasor === false, 'VELLOX nao consegue aceitar um pedido enderecado a NAUA');

  console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} FALHA(S)\n`);
  process.exit(falhas === 0 ? 0 : 1);
}

rodar().catch((e) => { console.error(e); process.exit(1); });
