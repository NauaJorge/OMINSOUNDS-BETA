// Gera um cookie de sessao valido para inspecionar as paginas internas
// localmente, sem precisar automatizar o formulario de login.
//   node --env-file=.env.local scripts/cookie-de-teste.mjs <handle>
import { createHmac, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const handle = process.argv[2] ?? 'naua';
const sql = neon(process.env.DATABASE_URL);
const linhas = await sql`SELECT id FROM usuarios WHERE handle = ${handle}`;
if (!linhas[0]) {
  console.error(`conta @${handle} nao existe`);
  process.exit(1);
}

const payload = Buffer.from(
  JSON.stringify({
    id: linhas[0].id,
    exp: Date.now() + 1000 * 60 * 30,
    n: randomBytes(8).toString('base64url'),
  })
).toString('base64url');

const assinatura = createHmac('sha256', process.env.SESSAO_SEGREDO)
  .update(payload)
  .digest('base64url');

console.log(`omin_sessao=${payload}.${assinatura}`);
