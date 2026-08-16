// Conta de teste de artista, para demonstrar o outro lado do marketplace.
//   node --env-file=.env.local scripts/semear-artista.mjs [--refazer]
//
// Com --refazer, zera o onboarding dela: serve para mostrar o fluxo do zero
// numa apresentação sem precisar criar conta nova toda vez.
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { gerarHash } from '../lib/senha.js';

const sql = neon(process.env.DATABASE_URL);
const refazer = process.argv.includes('--refazer');

const ARQUIVO = 'contas-de-teste.txt';
const HANDLE = 'lelo';

function sortearSenha() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(14), (b) => alfabeto[b % alfabeto.length]).join('');
}

const existente = await sql`SELECT id FROM usuarios WHERE handle = ${HANDLE}`;

if (existente[0] && refazer) {
  await sql`
    UPDATE usuarios
    SET onboarding_em = NULL, papel = 'artista',
        preferencias_generos = '{}', preferencias_moods = '{}', objetivo = ''
    WHERE id = ${existente[0].id}
  `;
  await sql`DELETE FROM seguidores WHERE seguidor_id = ${existente[0].id}`;
  console.log(`@${HANDLE}: onboarding zerado, pronto para demonstrar do zero.`);
  process.exit(0);
}

const senha = sortearSenha();
const hash = await gerarHash(senha);

await sql`
  INSERT INTO usuarios (handle, nome, email, senha_hash, papel, bio, cidade, avatar_url)
  VALUES (${HANDLE}, 'Lelo Martins', ${`${HANDLE}@ominisounds.test`}, ${hash},
          'artista', 'Rapper e compositor. Procura beat para gravar.',
          'Rio de Janeiro, RJ', '')
  ON CONFLICT (handle) DO UPDATE
    SET senha_hash = EXCLUDED.senha_hash, papel = 'artista', onboarding_em = NULL
`;

// Guarda a senha junto das outras, no arquivo que está no .gitignore.
if (existsSync(ARQUIVO)) {
  let txt = readFileSync(ARQUIVO, 'utf8');
  txt = txt.replace(/\nLelo Martins[\s\S]*?(?=\n\n|$)/, '');
  txt += `\nLelo Martins  (@${HANDLE})  — ARTISTA\n  e-mail: ${HANDLE}@ominisounds.test\n  senha:  ${senha}\n`;
  writeFileSync(ARQUIVO, txt, 'utf8');
  console.log(`@${HANDLE} criado como artista. Senha gravada em ${ARQUIVO}.`);
} else {
  console.log(`@${HANDLE} criado. Senha: ${senha}`);
}

const papeis = await sql`SELECT papel, count(*)::int AS n FROM usuarios GROUP BY papel ORDER BY papel`;
console.log('papéis no banco:', papeis.map((p) => `${p.papel}=${p.n}`).join(', '));
