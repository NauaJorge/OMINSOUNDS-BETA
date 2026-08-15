'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '../lib/db';
import { conferirSenha } from '../lib/senha';
import { criarSessao, encerrarSessao, usuarioAtual } from '../lib/sessao';
import {
  abrirPedido,
  responderPedido,
  responderNaConversa,
} from '../lib/mensagens';

export async function entrar(_estadoAnterior, dadosForm) {
  const email = String(dadosForm.get('email') ?? '').trim().toLowerCase();
  const senha = String(dadosForm.get('senha') ?? '');

  if (!email || !senha) {
    return { erro: 'Preencha e-mail e senha.' };
  }

  const linhas = await sql`
    SELECT id, senha_hash FROM usuarios WHERE lower(email) = ${email}
  `;
  const usuario = linhas[0];

  // Mesmo sem usuario, roda a conferencia contra um hash descartavel, para o
  // tempo de resposta nao denunciar quais e-mails existem.
  const hashParaConferir =
    usuario?.senha_hash ??
    'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  const confere = await conferirSenha(senha, hashParaConferir);

  if (!usuario || !confere) {
    return { erro: 'E-mail ou senha não conferem.' };
  }

  await criarSessao(usuario.id);
  redirect('/studio');
}

export async function sair() {
  await encerrarSessao();
  redirect('/');
}

export async function enviarPedido(_estadoAnterior, dadosForm) {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: 'Faça login para enviar mensagem.' };

  const paraHandle = String(dadosForm.get('para') ?? '').trim();
  const assunto = String(dadosForm.get('assunto') ?? '').trim().slice(0, 120);
  const corpo = String(dadosForm.get('corpo') ?? '').trim().slice(0, 2000);

  if (corpo.length < 2) return { erro: 'Escreva a mensagem.' };

  const resultado = await abrirPedido({
    deId: usuario.id,
    paraHandle,
    assunto,
    corpo,
  });
  if (resultado.erro) return { erro: resultado.erro };

  revalidatePath(`/produtor/${paraHandle}`);
  revalidatePath('/mensagens');
  return {
    ok: 'Pedido enviado. A pessoa vê que você quer falar, e só lê a mensagem depois de aceitar.',
  };
}

export async function aceitar(dadosForm) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  const conversaId = Number(dadosForm.get('conversa'));
  await responderPedido({ conversaId, usuarioId: usuario.id, aceitar: true });
  revalidatePath('/mensagens');
}

export async function recusar(dadosForm) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  const conversaId = Number(dadosForm.get('conversa'));
  await responderPedido({ conversaId, usuarioId: usuario.id, aceitar: false });
  revalidatePath('/mensagens');
}

export async function responder(_estadoAnterior, dadosForm) {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: 'Sessão expirada.' };

  const conversaId = Number(dadosForm.get('conversa'));
  const corpo = String(dadosForm.get('corpo') ?? '').trim().slice(0, 2000);
  if (corpo.length < 1) return { erro: 'Escreva alguma coisa.' };

  const ok = await responderNaConversa({ conversaId, usuarioId: usuario.id, corpo });
  if (!ok) return { erro: 'Não foi possível responder nesta conversa.' };

  revalidatePath(`/mensagens/${conversaId}`);
  return { ok: true };
}
