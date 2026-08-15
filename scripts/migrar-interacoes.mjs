// Favoritos de verdade e contagem de plays de verdade.
//   node --env-file=.env.local scripts/migrar-interacoes.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Par unico: favoritar duas vezes nao conta duas. A chave primaria composta
// resolve isso no banco, e nao na aplicacao.
await sql`
  CREATE TABLE IF NOT EXISTS favoritos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    beat_id    INTEGER NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, beat_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS favoritos_beat_idx ON favoritos (beat_id)`;

const tabelas = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;
console.log('tabelas:', tabelas.map((t) => t.table_name).join(', '));

const [{ f }] = await sql`SELECT count(*)::int AS f FROM favoritos`;
console.log('favoritos registrados:', f);
