// Troca a senha de uma conta.
//   node --env-file=.env.local scripts/trocar-senha.mjs <handle> <senha>
import { neon } from '@neondatabase/serverless';
import { gerarHash } from '../lib/senha.js';

const [handle, senha] = process.argv.slice(2);
if (!handle || !senha) {
  console.error('uso: node scripts/trocar-senha.mjs <handle> <senha>');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const hash = await gerarHash(senha);

const linhas = await sql`
  UPDATE usuarios SET senha_hash = ${hash}
  WHERE handle = ${handle}
  RETURNING handle, email
`;

if (!linhas[0]) {
  console.error(`conta @${handle} nao encontrada`);
  process.exit(1);
}

console.log(`senha trocada para @${linhas[0].handle} (${linhas[0].email})`);
console.log('lembre de atualizar contas-de-teste.txt se ele estiver aberto.');
