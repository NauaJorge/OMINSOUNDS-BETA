// Devolve uma conta ao começo do onboarding, sem apagar nada dela.
//   node --env-file=.env.local scripts/refazer-onboarding.mjs <handle>
//
// Catálogo, favoritos, conversas e seguidores continuam onde estão: só as
// respostas do fluxo e a marca de conclusão são limpas.
import { neon } from '@neondatabase/serverless';

const handle = process.argv[2];
if (!handle) {
  console.error('uso: node scripts/refazer-onboarding.mjs <handle>');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const antes = await sql`
  SELECT id, nome, papel, onboarding_em,
         (SELECT count(*)::int FROM beats WHERE produtor_id = usuarios.id) AS beats,
         (SELECT count(*)::int FROM favoritos WHERE usuario_id = usuarios.id) AS favoritos,
         (SELECT count(*)::int FROM seguidores WHERE seguidor_id = usuarios.id) AS seguindo
  FROM usuarios WHERE handle = ${handle}
`;

if (!antes[0]) {
  console.error(`conta @${handle} não encontrada`);
  process.exit(1);
}

const u = antes[0];
await sql`
  UPDATE usuarios
  SET onboarding_em = NULL, preferencias_generos = '{}',
      preferencias_moods = '{}', objetivo = ''
  WHERE id = ${u.id}
`;

console.log(`@${handle} (${u.nome}) volta ao início do onboarding.`);
console.log(`  papel: ${u.papel} — é o caminho que vai aparecer, e dá para trocar no passo 1`);
console.log(`  preservados: ${u.beats} beats, ${u.favoritos} favoritos, ${u.seguindo} seguindo`);
