// A arte de cada capa tem o genero e o BPM impressos nela. O cadastro no banco
// dizia outra coisa, e quem olha a tela ve a contradicao. Como a arte e um
// arquivo pronto, quem cede e o dado.
//   node --env-file=.env.local scripts/alinhar-capas.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const conforme = [
  { de: 'Noite Alta',   titulo: 'Noite Alta',    genero: 'Trap',      bpm: 142 },
  { de: 'Sol de Verao', titulo: 'Sol de Verão',  genero: 'Afrobeat',  bpm: 108 },
  { de: 'Calor',        titulo: 'Calor',         genero: 'Reggaeton', bpm: 96  },
  { de: 'Rota 21',      titulo: 'Rota 21',       genero: 'Drill',     bpm: 148 },
  { de: 'Vitrine',      titulo: 'Vitrine',       genero: 'Funk',      bpm: 130 },
];

for (const c of conforme) {
  const r = await sql`
    UPDATE beats SET titulo = ${c.titulo}, genero = ${c.genero}, bpm = ${c.bpm}
    WHERE titulo = ${c.de}
    RETURNING titulo, genero, bpm
  `;
  if (r[0]) console.log(`${r[0].titulo} -> ${r[0].genero} · ${r[0].bpm} BPM`);
  else console.log(`(nao achou "${c.de}")`);
}
