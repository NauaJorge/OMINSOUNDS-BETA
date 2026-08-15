// Confere que as senhas do contas-de-teste.txt batem com o hash guardado.
// Nunca imprime a senha.
//   node --env-file=.env.local scripts/testar-login.mjs
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { conferirSenha } from '../lib/senha.js';

const sql = neon(process.env.DATABASE_URL);
let falhas = 0;

function ok(condicao, texto) {
  console.log(`${condicao ? '  ok  ' : ' FALHA'}  ${texto}`);
  if (!condicao) falhas++;
}

const arquivo = readFileSync('contas-de-teste.txt', 'utf8').split('\n');
const contas = [];
for (let i = 0; i < arquivo.length; i++) {
  const email = arquivo[i].match(/e-mail:\s*(\S+)/);
  if (email) {
    const senha = arquivo[i + 1].match(/senha:\s*(\S+)/);
    contas.push({ email: email[1], senha: senha[1] });
  }
}

ok(contas.length === 3, `encontrou 3 contas no arquivo (achou ${contas.length})`);

for (const c of contas) {
  const linhas = await sql`SELECT handle, senha_hash FROM usuarios WHERE email = ${c.email}`;
  const u = linhas[0];
  ok(!!u, `${c.email} existe no banco`);
  if (!u) continue;

  ok(await conferirSenha(c.senha, u.senha_hash), `@${u.handle}: a senha do arquivo autentica`);
  ok(!(await conferirSenha(c.senha + 'x', u.senha_hash)), `@${u.handle}: senha errada e recusada`);
  ok(u.senha_hash.startsWith('scrypt$'), `@${u.handle}: guardada como hash scrypt, nao em texto`);
  ok(!u.senha_hash.includes(c.senha), `@${u.handle}: a senha nao aparece dentro do hash`);
}

console.log(falhas === 0 ? '\nLOGIN OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
