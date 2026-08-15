// Prepara a tabela para conta criada pelo proprio produtor, por e-mail ou
// por conta Google.
//   node --env-file=.env.local scripts/migrar-cadastro.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Quem entra pelo Google nao tem senha. Manter a coluna NOT NULL obrigaria a
// inventar um hash falso, e hash falso e coisa que um dia alguem tenta usar.
await sql`ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL`;

await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_sub TEXT`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS usuarios_google_sub_idx ON usuarios (google_sub) WHERE google_sub IS NOT NULL`;

await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT false`;

// Busca por e-mail sempre em minusculo, para nao existir conta duplicada que
// difere so na caixa das letras.
await sql`CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_minusculo_idx ON usuarios (lower(email))`;

const colunas = await sql`
  SELECT column_name, is_nullable FROM information_schema.columns
  WHERE table_name = 'usuarios' ORDER BY ordinal_position
`;
console.log('colunas de usuarios:');
for (const c of colunas) console.log(`  ${c.column_name}${c.is_nullable === 'YES' ? ' (aceita nulo)' : ''}`);
