// Tags livres e beat gratuito.
//   node --env-file=.env.local scripts/migrar-tags.mjs
//
// Genero, BPM e tom respondem "como soa". Tag responde "parece com quem",
// que e como artista procura de verdade: ninguem digita "trap 142 bpm",
// digita o nome de quem ele quer soar parecido.
//
// Beat gratuito nao e caridade: e a isca. O produtor solta um de graca para
// o artista conhecer o trabalho e voltar para comprar os outros. Esta na
// propria descricao da BeatStars, "license and sell beats and give away
// free beats".
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'`;
await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS gratis BOOLEAN NOT NULL DEFAULT false`;
// GIN e o indice que serve para procurar dentro de array.
await sql`CREATE INDEX IF NOT EXISTS beats_tags_idx ON beats USING GIN (tags)`;

const catalogo = [
  { titulo: 'Noite Alta',   tags: ['type beat', 'noturno', 'melodia sombria', '808 pesado'], gratis: false },
  { titulo: 'Sol de Verão', tags: ['type beat', 'praia', 'afro house', 'verão'],             gratis: true  },
  { titulo: 'Calor',        tags: ['type beat', 'dança', 'latino', 'percussão'],             gratis: false },
  { titulo: 'Rota 21',      tags: ['type beat', 'drill uk', 'agressivo', 'slide de baixo'],  gratis: false },
  { titulo: 'Vitrine',      tags: ['type beat', 'funk rj', 'festa', 'grave'],                gratis: true  },
];

for (const c of catalogo) {
  const r = await sql`
    UPDATE beats SET tags = ${c.tags}, gratis = ${c.gratis}
    WHERE titulo = ${c.titulo} RETURNING titulo, gratis
  `;
  if (r[0]) console.log(`${r[0].titulo.padEnd(14)} ${r[0].gratis ? 'GRATIS' : '      '}  ${c.tags.join(', ')}`);
}

// Beat gratuito nao tem escada de licenca: o arquivo sai com uma licenca so.
const gratuitos = await sql`SELECT id FROM beats WHERE gratis`;
for (const g of gratuitos) {
  await sql`DELETE FROM licencas WHERE beat_id = ${g.id}`;
  await sql`
    INSERT INTO licencas (beat_id, nome, ordem, preco_centavos, formatos, uso)
    VALUES (${g.id}, 'Grátis', 1, 0, 'MP3 320kbps',
            'Uso não comercial, com crédito obrigatório ao produtor. Para lançar comercialmente, fale com ele.')
  `;
}

const [{ g }] = await sql`SELECT count(*)::int AS g FROM beats WHERE gratis`;
const [{ t }] = await sql`SELECT count(DISTINCT tag)::int AS t FROM beats, unnest(tags) AS tag`;
console.log(`\nbeats gratuitos: ${g} | tags distintas: ${t}`);
