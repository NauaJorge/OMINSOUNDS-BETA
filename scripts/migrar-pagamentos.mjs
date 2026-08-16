// Estrutura de pagamentos. Cartao e Pix ficam no checkout hospedado do provedor
// configurado (PagBank ou Mercado Pago); aqui guardamos apenas pedido, status e
// ids/resumos nao sensiveis.
//   node --env-file=.env.local scripts/migrar-pagamentos.mjs
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL.');
  process.exit(1);
}
const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS pedidos (
    id                       SERIAL PRIMARY KEY,
    comprador_id             INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    produtor_id              INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    beat_id                  INTEGER REFERENCES beats(id) ON DELETE SET NULL,
    licenca_id               INTEGER REFERENCES licencas(id) ON DELETE SET NULL,
    tipo                     TEXT NOT NULL CHECK (tipo IN ('licenca','plano')),
    descricao                TEXT NOT NULL,
    valor_centavos           INTEGER NOT NULL,
    status                   TEXT NOT NULL DEFAULT 'rascunho'
                             CHECK (status IN ('rascunho','aguardando_pagamento','aprovado','recusado','cancelado','expirado','erro')),
    provedor                 TEXT NOT NULL DEFAULT 'mercado_pago',
    provedor_preferencia_id  TEXT NOT NULL DEFAULT '',
    provedor_pagamento_id    TEXT NOT NULL DEFAULT '',
    checkout_url             TEXT NOT NULL DEFAULT '',
    metodo_pagamento         TEXT NOT NULL DEFAULT '',
    payload_resumo           JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em                TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

await sql`CREATE INDEX IF NOT EXISTS pedidos_comprador_idx ON pedidos (comprador_id, criado_em DESC)`;
await sql`CREATE INDEX IF NOT EXISTS pedidos_provedor_pagamento_idx ON pedidos (provedor, provedor_pagamento_id)`;

await sql`
  CREATE TABLE IF NOT EXISTS pagamento_eventos (
    id                 SERIAL PRIMARY KEY,
    pedido_id           INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
    provedor            TEXT NOT NULL,
    evento_tipo         TEXT NOT NULL,
    provedor_evento_id  TEXT NOT NULL DEFAULT '',
    payload_resumo      JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS licencas_compradas (
    id             SERIAL PRIMARY KEY,
    pedido_id       INTEGER NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,
    comprador_id    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    beat_id         INTEGER REFERENCES beats(id) ON DELETE SET NULL,
    licenca_id      INTEGER REFERENCES licencas(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'ativa',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

console.log('Tabelas de pagamento aplicadas.');
