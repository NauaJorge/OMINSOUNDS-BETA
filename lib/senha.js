import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// scrypt vem do proprio Node. Evita dependencia nativa, que quebra em
// Windows com facilidade, e e forte o bastante para senha de conta.
const CUSTO = { N: 16384, r: 8, p: 1 };
const TAMANHO = 64;

export async function gerarHash(senha) {
  const sal = randomBytes(16);
  const derivada = await scryptAsync(senha.normalize('NFKC'), sal, TAMANHO, CUSTO);
  return `scrypt$${CUSTO.N}$${CUSTO.r}$${CUSTO.p}$${sal.toString('base64')}$${derivada.toString('base64')}`;
}

export async function conferirSenha(senha, hashGuardado) {
  try {
    const [algoritmo, N, r, p, salB64, esperadaB64] = hashGuardado.split('$');
    if (algoritmo !== 'scrypt') return false;

    const esperada = Buffer.from(esperadaB64, 'base64');
    const derivada = await scryptAsync(
      senha.normalize('NFKC'),
      Buffer.from(salB64, 'base64'),
      esperada.length,
      { N: Number(N), r: Number(r), p: Number(p) }
    );
    // timingSafeEqual exige mesmo tamanho, e comparar assim evita vazar
    // informacao pelo tempo de resposta.
    return derivada.length === esperada.length && timingSafeEqual(derivada, esperada);
  } catch {
    return false;
  }
}
