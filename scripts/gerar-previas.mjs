// Gera a previa de cada beat e calcula os picos do waveform.
//   node --env-file=.env.local scripts/gerar-previas.mjs
//
// Duas coisas de uma vez:
//
// 1. Previa de 30s em vez do arquivo inteiro. Marketplace de beat nunca serve
//    a faixa completa: pesa e entrega o produto de graca. Cada beat recebe um
//    trecho diferente da fonte, entao tambem para de existir beat diferente
//    com forma de onda identica.
//
// 2. Picos calculados aqui, no build, e guardados no banco. O caminho comum e
//    jogar wavesurfer.js na pagina e deixar cada cartao decodificar o audio no
//    navegador para desenhar a onda — com varios cartoes na tela isso baixa e
//    decodifica megabytes so para desenhar risquinho. Com os picos prontos, o
//    desenho custa um array de 140 numeros.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const RAIZ = 'public/assents/music';
const SAIDA = `${RAIZ}/previas`;
const BALDES = 140;

mkdirSync(SAIDA, { recursive: true });

const previas = [
  { titulo: 'Noite Alta',   fonte: 'filipe-ret-quero-paz.mp3', inicio: 20 },
  { titulo: 'Calor',        fonte: 'rona-music.mp3',           inicio: 30 },
  { titulo: 'Sol de Verão', fonte: 'filipe-ret-quero-paz.mp3', inicio: 75 },
  { titulo: 'Rota 21',      fonte: 'rona-music.mp3',           inicio: 95 },
  { titulo: 'Vitrine',      fonte: 'rona-music.mp3',           inicio: 8  },
];

function arquivoDe(titulo) {
  return titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Decodifica o trecho em PCM cru e reduz a BALDES valores entre 0 e 1. */
function calcularPicos(caminho) {
  const cru = execFileSync('ffmpeg', [
    '-v', 'error', '-i', caminho,
    '-ac', '1', '-ar', '8000', '-f', 's16le', '-',
  ], { maxBuffer: 1024 * 1024 * 64 });

  const amostras = new Int16Array(cru.buffer, cru.byteOffset, Math.floor(cru.length / 2));
  const porBalde = Math.floor(amostras.length / BALDES);
  const picos = [];

  for (let b = 0; b < BALDES; b++) {
    let maior = 0;
    for (let i = b * porBalde; i < (b + 1) * porBalde; i++) {
      const v = Math.abs(amostras[i]);
      if (v > maior) maior = v;
    }
    picos.push(maior / 32768);
  }

  // Normaliza pelo maior pico do proprio trecho: senao um beat mais baixo
  // desenha uma onda achatada e parece que nao tem nada tocando.
  const teto = Math.max(...picos, 0.0001);
  return picos.map((p) => Number((p / teto).toFixed(3)));
}

await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS picos TEXT NOT NULL DEFAULT ''`;
await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS duracao_seg INTEGER NOT NULL DEFAULT 0`;

for (const p of previas) {
  const nome = `${arquivoDe(p.titulo)}.mp3`;
  const destino = `${SAIDA}/${nome}`;

  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-ss', String(p.inicio), '-t', '30',
    '-i', `${RAIZ}/${p.fonte}`,
    '-af', 'afade=t=in:st=0:d=1.5,afade=t=out:st=28.5:d=1.5',
    '-c:a', 'libmp3lame', '-b:a', '96k',
    destino,
  ]);

  const picos = calcularPicos(destino);
  const kb = Math.round(statSync(destino).size / 1024);

  const r = await sql`
    UPDATE beats
    SET audio_url = ${`/assents/music/previas/${nome}`},
        picos = ${JSON.stringify(picos)},
        duracao_seg = 30
    WHERE titulo = ${p.titulo}
    RETURNING titulo
  `;
  console.log(`${r[0] ? 'ok  ' : 'NAO '} ${p.titulo.padEnd(14)} ${String(kb).padStart(4)} KB  ${picos.length} picos`);
}

const [{ total }] = await sql`SELECT count(*)::int AS total FROM beats WHERE picos <> ''`;
console.log(`\nbeats com waveform: ${total}`);
