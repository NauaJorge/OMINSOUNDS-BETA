// Confere que o contador de favoritos nunca sai de sincronia com a tabela.
//   node --env-file=.env.local scripts/testar-favoritos.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
let falhas = 0;
const ok = (c, t) => { console.log(`${c ? '  ok  ' : ' FALHA'}  ${t}`); if (!c) falhas++; };

const [u] = await sql`SELECT id FROM usuarios WHERE handle = 'naua'`;
const [b] = await sql`SELECT id, favoritos FROM beats ORDER BY id LIMIT 1`;

await sql`DELETE FROM favoritos WHERE usuario_id = ${u.id} AND beat_id = ${b.id}`;
await sql`UPDATE beats SET favoritos = ${b.favoritos} WHERE id = ${b.id}`;
const inicial = b.favoritos;

// Mesma sequencia que a acao do servidor executa.
async function favoritar() {
  await sql`INSERT INTO favoritos (usuario_id, beat_id) VALUES (${u.id}, ${b.id}) ON CONFLICT DO NOTHING`;
  const r = await sql`UPDATE beats SET favoritos = favoritos + 1 WHERE id = ${b.id} RETURNING favoritos`;
  return r[0].favoritos;
}
async function desfavoritar() {
  const rem = await sql`DELETE FROM favoritos WHERE usuario_id = ${u.id} AND beat_id = ${b.id} RETURNING beat_id`;
  if (!rem[0]) return null;
  const r = await sql`UPDATE beats SET favoritos = GREATEST(favoritos - 1, 0) WHERE id = ${b.id} RETURNING favoritos`;
  return r[0].favoritos;
}

console.log('\n1. Favoritar');
const depois = await favoritar();
ok(depois === inicial + 1, `contador foi de ${inicial} para ${depois}`);
const [{ n1 }] = await sql`SELECT count(*)::int AS n1 FROM favoritos WHERE beat_id = ${b.id} AND usuario_id = ${u.id}`;
ok(n1 === 1, 'registro existe na tabela');

console.log('\n2. Favoritar de novo nao conta duas vezes');
await sql`INSERT INTO favoritos (usuario_id, beat_id) VALUES (${u.id}, ${b.id}) ON CONFLICT DO NOTHING`;
const [{ n2 }] = await sql`SELECT count(*)::int AS n2 FROM favoritos WHERE beat_id = ${b.id} AND usuario_id = ${u.id}`;
ok(n2 === 1, 'a chave primaria composta barra o duplicado');

console.log('\n3. Desfavoritar');
const volta = await desfavoritar();
ok(volta === inicial, `contador voltou para ${volta}`);
const [{ n3 }] = await sql`SELECT count(*)::int AS n3 FROM favoritos WHERE beat_id = ${b.id} AND usuario_id = ${u.id}`;
ok(n3 === 0, 'registro saiu da tabela');

console.log('\n4. Desfavoritar o que nao esta favoritado nao mexe no contador');
const nada = await desfavoritar();
ok(nada === null, 'a acao percebe que nao havia nada e nao decrementa');
const [{ atual }] = await sql`SELECT favoritos AS atual FROM beats WHERE id = ${b.id}`;
ok(atual === inicial, `contador segue em ${atual}`);

console.log('\n5. Contador nunca fica negativo');
await sql`UPDATE beats SET favoritos = 0 WHERE id = ${b.id}`;
const r = await sql`UPDATE beats SET favoritos = GREATEST(favoritos - 1, 0) WHERE id = ${b.id} RETURNING favoritos`;
ok(r[0].favoritos === 0, 'GREATEST segura em zero');
await sql`UPDATE beats SET favoritos = ${inicial} WHERE id = ${b.id}`;

console.log(falhas === 0 ? '\nFAVORITOS OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
