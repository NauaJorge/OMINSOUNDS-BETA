// Confere que as respostas do onboarding mudam mesmo o que aparece.
//   node --env-file=.env.local scripts/testar-feed.mjs
import { neon } from '@neondatabase/serverless';
import {
  deQuemSegue, peloGosto, peloObjetivo, paraCompletar,
  contarSeguindo, contarSeguidores, jaSegue, paraFila, AJUSTE_POR_OBJETIVO,
} from '../lib/descoberta.js';
import { alternarSeguir, salvarGosto, salvarObjetivo } from '../lib/onboarding.js';

const sql = neon(process.env.DATABASE_URL);
let falhas = 0;
const ok = (c, t) => { console.log(`${c ? '  ok  ' : ' FALHA'}  ${t}`); if (!c) falhas++; };

const marca = Date.now().toString(36).slice(-5);
const email = `feed_${marca}@ominisounds.test`;
await sql`DELETE FROM usuarios WHERE email = ${email}`;
const [{ id }] = await sql`
  INSERT INTO usuarios (handle, nome, email, senha_hash, papel)
  VALUES (${`feed_${marca}`}, 'Teste Feed', ${email}, 'x', 'artista')
  RETURNING id
`;

console.log('\n1. Feed vazio de quem não respondeu nada');
ok((await deQuemSegue(id)).length === 0, 'sem seguir ninguém, a faixa vem vazia');
ok((await peloGosto(id)).length === 0, 'sem marcar gosto, a faixa vem vazia');
ok((await peloObjetivo('')).beats.length === 0, 'sem objetivo, não há faixa');
ok((await paraCompletar(id, [])).length > 0, 'mas o completar traz algo, para a página não ficar em branco');

console.log('\n2. O gosto muda o que aparece');
await salvarGosto(id, { generos: ['Drill'], moods: [] });
const drill = await peloGosto(id);
ok(drill.length > 0, `marcar Drill traz ${drill.length} beat(s)`);
ok(drill.every((b) => b.genero === 'Drill'), 'e todos são do gênero marcado');

await salvarGosto(id, { generos: ['Reggaeton'], moods: [] });
const reg = await peloGosto(id);
ok(reg.every((b) => b.genero === 'Reggaeton'), 'trocar para Reggaeton troca o resultado');
ok(drill[0]?.id !== reg[0]?.id, 'e o primeiro beat é outro');

console.log('\n3. O objetivo muda a faixa');
const explorando = await peloObjetivo('explorando');
ok(explorando.beats.length > 0, `"explorando" traz ${explorando.beats.length} beat(s)`);
ok(explorando.beats.every((b) => b.gratis), 'e todos são gratuitos');
ok(explorando.ajuste.titulo === AJUSTE_POR_OBJETIVO.explorando.titulo, 'com o título certo');

const comercial = await peloObjetivo('comercial');
ok(comercial.beats.length > 0, `"comercial" traz ${comercial.beats.length} beat(s)`);
const temTrackout = await Promise.all(comercial.beats.map(async (b) => {
  const r = await sql`SELECT 1 FROM licencas WHERE beat_id = ${b.id} AND (exclusiva OR nome = 'Trackout')`;
  return r.length > 0;
}));
ok(temTrackout.every(Boolean), 'e todos têm Trackout ou Exclusiva');

const barato = await peloObjetivo('conteudo');
const precos = barato.beats.map((b) => b.preco_centavos);
ok(precos.every((p, i) => i === 0 || precos[i - 1] <= p), '"conteúdo" vem do mais barato ao mais caro');

ok((await peloObjetivo('inventado')).ajuste === null, 'objetivo inventado não gera faixa');

console.log('\n4. Seguir enche o feed');
const [prod] = await sql`
  SELECT u.id FROM usuarios u
  WHERE u.papel = 'produtor' AND EXISTS (SELECT 1 FROM beats b WHERE b.produtor_id = u.id AND b.publicado)
  LIMIT 1
`;
ok(!(await jaSegue(id, prod.id)), 'antes de seguir, não segue');
ok((await contarSeguindo(id)) === 0, 'contador em zero');

await alternarSeguir(id, prod.id);
ok(await jaSegue(id, prod.id), 'depois de seguir, segue');
ok((await contarSeguindo(id)) === 1, 'contador em um');

const doSeguido = await deQuemSegue(id);
ok(doSeguido.length > 0, `a faixa "de quem você segue" passa a ter ${doSeguido.length} beat(s)`);
const todosDele = await Promise.all(doSeguido.map(async (b) => {
  const r = await sql`SELECT 1 FROM beats WHERE id = ${b.id} AND produtor_id = ${prod.id}`;
  return r.length > 0;
}));
ok(todosDele.every(Boolean), 'e são todos do produtor seguido');

ok((await contarSeguidores(prod.id)) >= 1, 'o produtor vê o seguidor no contador dele');

console.log('\n5. Sem repetição entre as faixas');
await salvarGosto(id, { generos: ['Trap', 'Drill', 'Funk', 'Reggaeton', 'Afrobeat'], moods: [] });
const seg = await deQuemSegue(id);
const gos = await peloGosto(id);
const cruzados = gos.filter((g) => seg.some((s) => s.id === g.id));
ok(cruzados.length === 0, 'quem já está em "de quem você segue" não repete em "do seu gosto"');

console.log('\n6. Formato que o player espera');
const fila = paraFila(gos);
ok(fila.every((f) => f.id && f.audio && Array.isArray(f.picos)), 'a fila sai com id, áudio e picos');
ok(fila.every((f) => f.bpm !== undefined && f.tom !== undefined), 'com bpm e tom, para o ajuste de andamento');

await sql`DELETE FROM usuarios WHERE id = ${id}`;
console.log('\n(conta de teste removida)');
console.log(falhas === 0 ? '\nFEED OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
