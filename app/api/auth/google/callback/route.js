import { NextResponse } from 'next/server';
import { criarSessao } from '../../../../../lib/sessao';
import { acharOuCriarPeloGoogle, googleConfigurado } from '../../../../../lib/usuarios';
import { enderecoDeRetorno } from '../route';

export const dynamic = 'force-dynamic';

function falha(req, motivo) {
  return NextResponse.redirect(new URL(`/entrar?erro=${motivo}`, req.url));
}

export async function GET(req) {
  if (!googleConfigurado()) return falha(req, 'google-desligado');

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (url.searchParams.get('error')) return falha(req, 'google-cancelado');
  if (!code) return falha(req, 'google-sem-codigo');

  // O state tem que bater com o cookie que saiu deste navegador.
  const esperado = req.cookies.get('omin_google_state')?.value;
  if (!esperado || !state || esperado !== state) return falha(req, 'google-state');

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: enderecoDeRetorno(req),
      grant_type: 'authorization_code',
    }),
  });
  if (!resposta.ok) return falha(req, 'google-token');

  const { access_token } = await resposta.json();
  if (!access_token) return falha(req, 'google-token');

  const perfilResp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!perfilResp.ok) return falha(req, 'google-perfil');

  const perfil = await perfilResp.json();
  if (!perfil.email) return falha(req, 'google-sem-email');
  // Conta Google sem e-mail confirmado nao serve para identificar ninguem.
  if (perfil.email_verified === false) return falha(req, 'google-email-nao-verificado');

  const id = await acharOuCriarPeloGoogle({
    sub: perfil.sub,
    email: perfil.email,
    nome: perfil.name,
    foto: perfil.picture,
  });

  await criarSessao(id);

  const ida = NextResponse.redirect(new URL('/studio', req.url));
  ida.cookies.delete('omin_google_state');
  return ida;
}
