// Confere as regras do onboarding sem passar pela interface.
//   node --env-file=.env.local scripts/testar-onboarding.mjs
import { neon } from '@neondatabase/serverless';
import {
  PASSOS, OBJETIVOS, proximoPasso, posicaoDoPasso, destinoFinal,
  definirPapel, salvarGosto, salvarObjetivo, salvarVitrine,
  concluir, precisaDeOnboarding, alternarSeguir, virarProdutor,
  produtoresParaSeguir,
} from '../lib/onboarding.js';

const sql = neon(process.env.DATABASE_URL);
let falhas = 0;
const ok = (c, t) => { console.log(`${c ? '  ok  ' : ' FALHA'}  ${t}`); if (!c) falhas++; };

console.log('\n1. Sequência dos passos');
ok(proximoPasso('artista', 'gosto') === 'objetivo', 'artista: gosto → objetivo');
ok(proximoPasso('artista', 'seguir') === null, 'artista: seguir é o último');
ok(proximoPasso('produtor', 'vitrine') === 'como-funciona', 'produtor: vitrine → como-funciona');
ok(proximoPasso('produtor', 'primeiro-beat') === null, 'produtor: primeiro-beat é o último');
ok(proximoPasso('artista', 'inexistente') === null, 'passo desconhecido não quebra');

console.log('\n2. Contagem mostrada na barra');
ok(posicaoDoPasso('artista', 'gosto').atual === 2, 'gosto é o passo 2 (o 1 é a escolha)');
ok(posicaoDoPasso('artista', 'gosto').total === 4, 'total de 4 no caminho do artista');
ok(posicaoDoPasso('produtor', 'primeiro-beat').atual === 4, 'primeiro-beat é o passo 4');

console.log('\n3. Destino final por papel');
ok(destinoFinal('artista') === '/beats', 'artista termina no catálogo');
ok(destinoFinal('produtor') === '/studio', 'produtor termina no Studio');

console.log('\n4. Conta de teste percorrendo o fluxo');
const marca = Date.now().toString(36).slice(-5);
const email = `onb_${marca}@ominisounds.test`;
await sql`DELETE FROM usuarios WHERE email = ${email}`;
const criado = await sql`
  INSERT INTO usuarios (handle, nome, email, senha_hash, papel)
  VALUES (${`onb_${marca}`}, 'Teste Onboarding', ${email}, 'x', 'produtor')
  RETURNING id
`;
const id = criado[0].id;

ok(await precisaDeOnboarding(id), 'conta nova precisa de onboarding');
ok(await definirPapel(id, 'artista'), 'vira artista');
ok(!(await definirPapel(id, 'invasor')), 'papel inventado é recusado');

const [{ papel }] = await sql`SELECT papel FROM usuarios WHERE id = ${id}`;
ok(papel === 'artista', 'papel gravado é artista, não o inventado');

await salvarGosto(id, { generos: ['Trap', 'Drill'], moods: ['Sombrio'] });
const [g] = await sql`SELECT preferencias_generos AS gen, preferencias_moods AS mood FROM usuarios WHERE id = ${id}`;
ok(g.gen.length === 2 && g.mood.length === 1, 'gosto gravado');

await salvarObjetivo(id, 'comercial');
const [o1] = await sql`SELECT objetivo FROM usuarios WHERE id = ${id}`;
ok(o1.objetivo === 'comercial', 'objetivo válido gravado');

await salvarObjetivo(id, 'qualquer-coisa');
const [o2] = await sql`SELECT objetivo FROM usuarios WHERE id = ${id}`;
ok(o2.objetivo === '', 'objetivo inválido vira vazio, não entra sujo');

console.log('\n5. Seguir produtores');
const sugestoes = await produtoresParaSeguir(id);
ok(sugestoes.length > 0, `${sugestoes.length} produtores sugeridos`);
ok(!sugestoes.some((p) => p.id === id), 'a própria conta não aparece na lista');

const alvo = sugestoes[0].id;
ok((await alternarSeguir(id, alvo)).seguindo === true, 'seguir marca');
const [{ n1 }] = await sql`SELECT count(*)::int AS n1 FROM seguidores WHERE seguidor_id = ${id}`;
ok(n1 === 1, 'registro criado');

await alternarSeguir(id, alvo);
await alternarSeguir(id, alvo);
const [{ n2 }] = await sql`SELECT count(*)::int AS n2 FROM seguidores WHERE seguidor_id = ${id} AND seguido_id = ${alvo}`;
ok(n2 === 1, 'alternar duas vezes volta a seguir, sem duplicar');

ok((await alternarSeguir(id, id)).erro === 'nao-a-si-mesmo', 'não dá para seguir a si mesmo');

console.log('\n6. Conclusão');
await concluir(id);
ok(!(await precisaDeOnboarding(id)), 'depois de concluir, não repete');

console.log('\n7. Artista vira produtor');
ok(await virarProdutor(id), 'a troca acontece');
const [{ papel: p2 }] = await sql`SELECT papel FROM usuarios WHERE id = ${id}`;
ok(p2 === 'produtor', 'papel virou produtor');
ok(!(await virarProdutor(id)), 'chamar de novo em quem já é produtor não faz nada');

console.log('\n8. O que sobrou de pé');
ok(Object.keys(PASSOS).length === 2, 'dois caminhos definidos');
ok(OBJETIVOS.length === 4, 'quatro objetivos');
ok(!(await precisaDeOnboarding(999999)), 'id inexistente não trava');

await sql`DELETE FROM usuarios WHERE id = ${id}`;
console.log('\n(conta de teste removida)');
console.log(falhas === 0 ? '\nONBOARDING OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
