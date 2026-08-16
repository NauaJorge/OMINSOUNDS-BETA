// Papel de artista, preferências e a tabela de seguidores.
//   node --env-file=.env.local scripts/migrar-onboarding.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// O papel deixa de ser só 'produtor'. A restrição entra depois das colunas,
// para o banco recusar valor digitado errado em vez de aceitar em silêncio.
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS preferencias_generos TEXT[] NOT NULL DEFAULT '{}'`;
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS preferencias_moods   TEXT[] NOT NULL DEFAULT '{}'`;
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS objetivo             TEXT NOT NULL DEFAULT ''`;
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_em        TIMESTAMPTZ`;

await sql`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS papel_valido`;
await sql`ALTER TABLE usuarios ADD CONSTRAINT papel_valido CHECK (papel IN ('produtor','artista'))`;

// Par único, mesma ideia da tabela de favoritos: seguir duas vezes não conta
// duas, e quem garante é o banco.
await sql`
  CREATE TABLE IF NOT EXISTS seguidores (
    seguidor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    seguido_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (seguidor_id, seguido_id),
    CONSTRAINT nao_seguir_a_si_mesmo CHECK (seguidor_id <> seguido_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS seguidores_seguido_idx ON seguidores (seguido_id)`;

// Quem já existe não deve cair no onboarding: as contas de teste e as do
// Diretor já estão em uso.
await sql`UPDATE usuarios SET onboarding_em = now() WHERE onboarding_em IS NULL`;

const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'usuarios' ORDER BY ordinal_position
`;
console.log('usuarios:', cols.map((c) => c.column_name).join(', '));

const [{ n }] = await sql`SELECT count(*)::int AS n FROM usuarios WHERE onboarding_em IS NOT NULL`;
console.log(`contas com onboarding já concluído: ${n}`);
