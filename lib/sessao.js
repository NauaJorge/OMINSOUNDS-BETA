import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { sql } from './db.js';

const COOKIE = 'omin_sessao';
const DURACAO_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function segredo() {
  const s = process.env.SESSAO_SEGREDO;
  if (!s) throw new Error('SESSAO_SEGREDO nao definida.');
  return s;
}

// Cookie assinado, sem banco de sessoes: "<payload em base64url>.<assinatura>".
// O payload traz o id, a expiracao e um nonce, para dois logins do mesmo
// usuario nao gerarem o mesmo token.
function assinar(valor) {
  return createHmac('sha256', segredo()).update(valor).digest('base64url');
}

export async function criarSessao(usuarioId) {
  const payload = Buffer.from(
    JSON.stringify({
      id: usuarioId,
      exp: Date.now() + DURACAO_MS,
      n: randomBytes(8).toString('base64url'),
    })
  ).toString('base64url');

  const token = `${payload}.${assinar(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_MS / 1000,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

function lerToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, assinatura] = token.split('.');

  const esperada = Buffer.from(assinar(payload));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length) return null;
  if (!timingSafeEqual(esperada, recebida)) return null;

  try {
    const dados = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!dados.exp || dados.exp < Date.now()) return null;
    return dados.id;
  } catch {
    return null;
  }
}

/** Devolve o usuario logado, ou null. Nunca devolve senha_hash. */
export async function usuarioAtual() {
  const jar = await cookies();
  const id = lerToken(jar.get(COOKIE)?.value);
  if (!id) return null;

  const linhas = await sql`
    SELECT id, handle, nome, email, papel, bio, cidade, avatar_url
    FROM usuarios WHERE id = ${id}
  `;
  return linhas[0] ?? null;
}
