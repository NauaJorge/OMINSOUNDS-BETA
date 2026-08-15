// Cria o esquema do banco. Roda quantas vezes precisar: tudo e IF NOT EXISTS.
//   npm run db:migrar
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Copie .env.example para .env.local e preencha.');
  process.exit(1);
}
const sql = neon(url);

async function migrar() {
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            SERIAL PRIMARY KEY,
      handle        TEXT NOT NULL UNIQUE,
      nome          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      senha_hash    TEXT NOT NULL,
      papel         TEXT NOT NULL DEFAULT 'produtor',
      bio           TEXT NOT NULL DEFAULT '',
      cidade        TEXT NOT NULL DEFAULT '',
      avatar_url    TEXT NOT NULL DEFAULT '',
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS beats (
      id            SERIAL PRIMARY KEY,
      produtor_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo        TEXT NOT NULL,
      capa_url      TEXT NOT NULL DEFAULT '',
      audio_url     TEXT NOT NULL DEFAULT '',
      bpm           INTEGER,
      tom           TEXT NOT NULL DEFAULT '',
      genero        TEXT NOT NULL DEFAULT '',
      mood          TEXT NOT NULL DEFAULT '',
      preco_centavos INTEGER NOT NULL DEFAULT 0,
      publicado     BOOLEAN NOT NULL DEFAULT true,
      plays         INTEGER NOT NULL DEFAULT 0,
      favoritos     INTEGER NOT NULL DEFAULT 0,
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS beats_produtor_idx ON beats (produtor_id, criado_em DESC)`;

  // Uma conversa por par de pessoas. Nasce 'pendente': enquanto estiver assim,
  // o destinatario NAO recebe o corpo de nenhuma mensagem — isso e garantido
  // nas consultas em lib/mensagens.ts, nao na interface.
  await sql`
    CREATE TABLE IF NOT EXISTS conversas (
      id             SERIAL PRIMARY KEY,
      solicitante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      destinatario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      situacao       TEXT NOT NULL DEFAULT 'pendente'
                     CHECK (situacao IN ('pendente','aceita','recusada')),
      assunto        TEXT NOT NULL DEFAULT '',
      criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
      respondido_em  TIMESTAMPTZ,
      CONSTRAINT conversa_par_unico UNIQUE (solicitante_id, destinatario_id),
      CONSTRAINT conversa_nao_consigo CHECK (solicitante_id <> destinatario_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS conversas_destinatario_idx ON conversas (destinatario_id, situacao, criado_em DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS mensagens (
      id          SERIAL PRIMARY KEY,
      conversa_id INTEGER NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
      autor_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      corpo       TEXT NOT NULL,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS mensagens_conversa_idx ON mensagens (conversa_id, criado_em)`;

  const [{ agora }] = await sql`SELECT now() AS agora`;
  console.log('Esquema aplicado. Banco respondeu em', agora);

  const tabelas = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log('Tabelas:', tabelas.map((t) => t.table_name).join(', '));
}

migrar().catch((erro) => {
  console.error('Falhou:', erro.message);
  process.exit(1);
});
