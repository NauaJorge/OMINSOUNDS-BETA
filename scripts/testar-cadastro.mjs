// Verifica as regras do cadastro proprio, sem passar pela interface.
//   node --env-file=.env.local scripts/testar-cadastro.mjs
import { neon } from '@neondatabase/serverless';
import { conferirSenha } from '../lib/senha.js';
import {
  normalizarHandle, validarCadastro, criarUsuario,
  emailEmUso, handleEmUso, handleLivre, acharOuCriarPeloGoogle,
} from '../lib/usuarios.js';

const sql = neon(process.env.DATABASE_URL);
let falhas = 0;
const ok = (c, t) => { console.log(`${c ? '  ok  ' : ' FALHA'}  ${t}`); if (!c) falhas++; };

console.log('\n1. Normalizacao do @');
ok(normalizarHandle('João Vítor') === 'joaovitor', 'tira acento e espaco');
ok(normalizarHandle('DJ-Mão!!') === 'djmao', 'tira pontuacao e caixa alta');
ok(normalizarHandle('bea_t_99') === 'bea_t_99', 'mantem _ e numero');

console.log('\n2. Validacao');
const vazio = validarCadastro({ nome: '', handle: '', email: '', senha: '' });
ok(Object.keys(vazio).length === 4, 'formulario vazio acusa os quatro campos');
ok(!!validarCadastro({ nome: 'A B', handle: 'ab', email: 'a@b.co', senha: 'senha123' }).handle, '@ curto demais e barrado');
ok(!!validarCadastro({ nome: 'A B', handle: 'studio', email: 'a@b.co', senha: 'senha123' }).handle, '@ reservado e barrado');
ok(!!validarCadastro({ nome: 'A B', handle: 'valido', email: 'sem-arroba', senha: 'senha123' }).email, 'e-mail invalido e barrado');
ok(!!validarCadastro({ nome: 'A B', handle: 'valido', email: 'a@b.co', senha: '1234' }).senha, 'senha curta e barrada');
ok(!!validarCadastro({ nome: 'A B', handle: 'valido', email: 'a@b.co', senha: '12345678' }).senha, 'senha so de numeros e barrada');
ok(Object.keys(validarCadastro({ nome: 'Ana Beat', handle: 'anabeat', email: 'ana@beat.co', senha: 'trap2026x' })).length === 0, 'cadastro valido passa');

console.log('\n3. Conta criada de verdade');
const marca = Date.now().toString(36).slice(-5);
const email = `teste_${marca}@ominisounds.test`;
const handle = `teste_${marca}`;
await sql`DELETE FROM usuarios WHERE email = ${email}`;

ok(!(await emailEmUso(email)), 'e-mail ainda livre');
const criado = await criarUsuario({ nome: 'Conta Teste', handle, email, senha: 'trap2026x' });
ok(!!criado?.id, 'conta criada');
ok(await emailEmUso(email), 'e-mail passa a constar em uso');
ok(await handleEmUso(handle), '@ passa a constar em uso');

const guardado = (await sql`SELECT senha_hash, papel FROM usuarios WHERE id = ${criado.id}`)[0];
ok(guardado.senha_hash.startsWith('scrypt$'), 'senha guardada como hash scrypt');
ok(!guardado.senha_hash.includes('trap2026x'), 'a senha nao aparece dentro do hash');
ok(await conferirSenha('trap2026x', guardado.senha_hash), 'a senha autentica');
ok(guardado.papel === 'produtor', 'nasce com papel de produtor');

console.log('\n4. Caixa do e-mail nao cria conta dupla');
ok(await emailEmUso(email.toUpperCase()), 'e-mail em maiuscula bate com o cadastrado');

console.log('\n5. @ sugerido para quem entra pelo Google');
const sugerido = await handleLivre(handle);
ok(sugerido !== handle, `@ ocupado gera alternativa (${sugerido})`);
ok(/^[a-z0-9_]+$/.test(sugerido), 'a alternativa continua valida');

console.log('\n6. Google reaproveita conta que ja existe com o mesmo e-mail');
const mesmoId = await acharOuCriarPeloGoogle({
  sub: `sub-${marca}`, email, nome: 'Conta Teste', foto: '',
});
ok(mesmoId === criado.id, 'amarra na conta existente em vez de criar outra');
const depois = (await sql`SELECT google_sub, senha_hash FROM usuarios WHERE id = ${criado.id}`)[0];
ok(depois.google_sub === `sub-${marca}`, 'google_sub gravado');
ok(!!depois.senha_hash, 'a senha antiga continua valendo: da para entrar dos dois jeitos');

const [{ total }] = await sql`SELECT count(*)::int AS total FROM usuarios WHERE lower(email) = ${email}`;
ok(total === 1, 'existe exatamente uma conta com esse e-mail');

await sql`DELETE FROM usuarios WHERE id = ${criado.id}`;
console.log('\n(conta de teste removida)');
console.log(falhas === 0 ? '\nCADASTRO OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
