// Cria as contas de teste e um catalogo inicial.
//   npm run db:semear
//
// As senhas sao sorteadas na hora e gravadas em contas-de-teste.txt, que esta
// no .gitignore. Nao passam por aqui duas vezes iguais, e nao vao para o git.
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { gerarHash } from '../lib/senha.js';

const sql = neon(process.env.DATABASE_URL);

function sortearSenha() {
  // Sem caracteres que confundem quando alguem le em voz alta ou digita.
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}

const contas = [
  {
    handle: 'naua',
    nome: 'Naua Jorge',
    email: 'naua@ominisounds.test',
    papel: 'produtor',
    cidade: 'Rio de Janeiro, RJ',
    bio: 'Conta de teste do time tecnico. Usada para demonstrar o Studio e a caixa de mensagens.',
    avatar_url: '/assents/img/produtor-domino.jpg',
  },
  {
    handle: 'bruma',
    nome: 'BRUMA',
    email: 'bruma@ominisounds.test',
    papel: 'produtor',
    cidade: 'Sao Paulo, SP',
    bio: 'Trap atmosferico e drill. Trabalha com camadas de sintetizador e bateria seca.',
    avatar_url: '/assents/img/produtor-bruma.jpg',
  },
  {
    handle: 'vellox',
    nome: 'VELLOX',
    email: 'vellox@ominisounds.test',
    papel: 'produtor',
    cidade: 'Belo Horizonte, MG',
    bio: 'Boom bap e sample flip. Corta vinil e monta groove em cima de bateria ao vivo.',
    avatar_url: '/assents/img/produtor-vellox.jpg',
  },
];

const catalogo = {
  naua: [
    { titulo: 'Rota 21', bpm: 140, tom: 'F# menor', genero: 'Trap', mood: 'Noturno', preco: 24900, capa: '/assents/img/capa-rota-21.jpg', audio: '/assents/music/rona-music.mp3', plays: 1840, favoritos: 96 },
    { titulo: 'Vitrine', bpm: 128, tom: 'C menor', genero: 'Drill', mood: 'Tenso', preco: 19900, capa: '/assents/img/capa-vitrine.jpg', audio: '/assents/music/rona-music.mp3', plays: 920, favoritos: 41 },
  ],
  bruma: [
    { titulo: 'Noite Alta', bpm: 146, tom: 'G menor', genero: 'Trap', mood: 'Sombrio', preco: 29900, capa: '/assents/img/capa-noite-alta.jpg', audio: '/assents/music/filipe-ret-quero-paz.mp3', plays: 4210, favoritos: 233 },
    { titulo: 'Calor', bpm: 132, tom: 'A menor', genero: 'Afrobeat', mood: 'Solar', preco: 21900, capa: '/assents/img/capa-calor.jpg', audio: '/assents/music/rona-music.mp3', plays: 2670, favoritos: 148 },
  ],
  vellox: [
    { titulo: 'Sol de Verao', bpm: 92, tom: 'D maior', genero: 'Boom bap', mood: 'Leve', preco: 17900, capa: '/assents/img/capa-sol-de-verao.jpg', audio: '/assents/music/filipe-ret-quero-paz.mp3', plays: 3105, favoritos: 187 },
  ],
};

async function semear() {
  const geradas = [];

  for (const conta of contas) {
    const senha = sortearSenha();
    const hash = await gerarHash(senha);

    const linhas = await sql`
      INSERT INTO usuarios (handle, nome, email, senha_hash, papel, bio, cidade, avatar_url)
      VALUES (${conta.handle}, ${conta.nome}, ${conta.email}, ${hash},
              ${conta.papel}, ${conta.bio}, ${conta.cidade}, ${conta.avatar_url})
      ON CONFLICT (handle) DO UPDATE
        SET senha_hash = EXCLUDED.senha_hash,
            nome = EXCLUDED.nome,
            bio = EXCLUDED.bio,
            cidade = EXCLUDED.cidade,
            avatar_url = EXCLUDED.avatar_url
      RETURNING id
    `;
    const id = linhas[0].id;
    geradas.push({ ...conta, senha, id });

    await sql`DELETE FROM beats WHERE produtor_id = ${id}`;
    for (const b of catalogo[conta.handle] ?? []) {
      await sql`
        INSERT INTO beats (produtor_id, titulo, capa_url, audio_url, bpm, tom, genero, mood, preco_centavos, plays, favoritos)
        VALUES (${id}, ${b.titulo}, ${b.capa}, ${b.audio}, ${b.bpm}, ${b.tom},
                ${b.genero}, ${b.mood}, ${b.preco}, ${b.plays}, ${b.favoritos})
      `;
    }
  }

  const linhasArquivo = [
    'CONTAS DE TESTE — OMINSOUNDS',
    'Geradas em ' + new Date().toISOString(),
    '',
    'Sao contas de demonstracao, em banco de teste, com conteudo ficticio.',
    'Nao reutilize estas senhas em nenhum outro lugar.',
    'Este arquivo esta no .gitignore e nao deve ser commitado.',
    '',
  ];
  for (const c of geradas) {
    linhasArquivo.push(
      `${c.nome}  (@${c.handle})`,
      `  e-mail: ${c.email}`,
      `  senha:  ${c.senha}`,
      ''
    );
  }
  writeFileSync('contas-de-teste.txt', linhasArquivo.join('\n'), 'utf8');

  console.log('Contas criadas:', geradas.map((c) => c.handle).join(', '));
  console.log('Senhas gravadas em contas-de-teste.txt (fora do git).');
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM beats`;
  console.log('Beats no catalogo:', total);
}

semear().catch((erro) => {
  console.error('Falhou:', erro.message);
  process.exit(1);
});
