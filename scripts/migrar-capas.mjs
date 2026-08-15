// Acrescenta a capa do perfil e preenche as tres contas de teste.
//   node --env-file=.env.local scripts/migrar-capas.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS capa_url TEXT NOT NULL DEFAULT ''`;

const capas = {
  naua: '/assents/img/capa-naua.jpg',
  bruma: '/assents/img/capa-bruma.jpg',
  vellox: '/assents/img/capa-vellox.jpg',
};

for (const [handle, capa] of Object.entries(capas)) {
  await sql`UPDATE usuarios SET capa_url = ${capa} WHERE handle = ${handle}`;
}

const linhas = await sql`SELECT handle, capa_url FROM usuarios ORDER BY handle`;
for (const l of linhas) console.log(`@${l.handle} -> ${l.capa_url || '(sem capa)'}`);
