// Licenca por formato, como funciona marketplace de beat de verdade.
//   node --env-file=.env.local scripts/migrar-licencas.mjs
//
// O preco solto no cartao nao diz nada: R$ 299 pelo que? MP3? WAV? Com os
// stems separados? Com direito a quantas execucoes? Sem isso o artista nao
// sabe o que esta levando e o produtor nao sabe o que esta vendendo.
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS licencas (
    id             SERIAL PRIMARY KEY,
    beat_id        INTEGER NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
    nome           TEXT NOT NULL,
    ordem          INTEGER NOT NULL DEFAULT 0,
    preco_centavos INTEGER NOT NULL,
    formatos       TEXT NOT NULL DEFAULT '',
    uso            TEXT NOT NULL DEFAULT '',
    exclusiva      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT licenca_unica_por_beat UNIQUE (beat_id, nome)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS licencas_beat_idx ON licencas (beat_id, ordem)`;

// Os degraus saem do preco base do beat, entao produtor que cobra mais caro
// tem a escada inteira mais cara, sem precisar mexer em cada linha.
const degraus = [
  { nome: 'Básica',    ordem: 1, fator: 1,  formatos: 'MP3 320kbps',                uso: 'Streaming e videoclipe, até 100 mil execuções. Crédito obrigatório.' },
  { nome: 'Premium',   ordem: 2, fator: 2,  formatos: 'WAV + MP3 320kbps',          uso: 'Streaming, clipe e shows, até 500 mil execuções. Crédito obrigatório.' },
  { nome: 'Trackout',  ordem: 3, fator: 4,  formatos: 'Stems separados + WAV + MP3', uso: 'Uso comercial sem limite de execuções. Permite remixar as camadas.' },
  { nome: 'Exclusiva', ordem: 4, fator: 10, formatos: 'Stems separados + WAV + MP3', uso: 'O beat sai do catálogo e os direitos passam para você.', exclusiva: true },
];

const beats = await sql`SELECT id, titulo, preco_centavos FROM beats ORDER BY id`;

for (const b of beats) {
  for (const d of degraus) {
    await sql`
      INSERT INTO licencas (beat_id, nome, ordem, preco_centavos, formatos, uso, exclusiva)
      VALUES (${b.id}, ${d.nome}, ${d.ordem}, ${b.preco_centavos * d.fator},
              ${d.formatos}, ${d.uso}, ${d.exclusiva ?? false})
      ON CONFLICT (beat_id, nome) DO UPDATE
        SET preco_centavos = EXCLUDED.preco_centavos,
            formatos = EXCLUDED.formatos,
            uso = EXCLUDED.uso,
            ordem = EXCLUDED.ordem,
            exclusiva = EXCLUDED.exclusiva
    `;
  }
  console.log(`${b.titulo}: 4 licenças, de ${(b.preco_centavos / 100).toFixed(0)} a ${(b.preco_centavos * 10 / 100).toFixed(0)} reais`);
}

const [{ total }] = await sql`SELECT count(*)::int AS total FROM licencas`;
console.log(`\ntotal de licenças: ${total}`);
