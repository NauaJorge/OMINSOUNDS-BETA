import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { googleConfigurado } from '../../../../lib/usuarios';

export const dynamic = 'force-dynamic';

export function enderecoDeRetorno(req) {
  // Em producao a Vercel entrega o host real neste cabecalho. Montar a URL a
  // partir dele evita ter que fixar o dominio em variavel, e continua
  // funcionando em localhost.
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const protocolo = req.headers.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  return `${protocolo}://${host}/api/auth/google/callback`;
}

export async function GET(req) {
  if (!googleConfigurado()) {
    return NextResponse.redirect(new URL('/entrar?erro=google-desligado', req.url));
  }

  // O state amarra o pedido a esta sessao de navegador. Sem ele, alguem pode
  // te empurrar um callback e logar voce numa conta que nao e sua (CSRF de login).
  const state = randomBytes(16).toString('base64url');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', enderecoDeRetorno(req));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  const resposta = NextResponse.redirect(url.toString());
  resposta.cookies.set('omin_google_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });
  return resposta;
}
