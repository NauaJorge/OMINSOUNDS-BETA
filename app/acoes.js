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
import {
  normalizarHandle,
  validarCadastro,
  criarUsuario,
  emailEmUso,
  handleEmUso,
} from '../lib/usuarios';

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

export async function cadastrar(_estadoAnterior, dadosForm) {
  const nome = String(dadosForm.get('nome') ?? '').trim();
  const handle = normalizarHandle(dadosForm.get('handle'));
  const email = String(dadosForm.get('email') ?? '').trim().toLowerCase();
  const senha = String(dadosForm.get('senha') ?? '');

  const erros = validarCadastro({ nome, handle, email, senha });
  // Os valores voltam para o formulario para a pessoa nao redigitar tudo por
  // causa de um campo. A senha nao volta, de proposito.
  const eco = { nome, handle, email };

  if (Object.keys(erros).length) return { erros, eco };

  if (await emailEmUso(email)) {
    return { erros: { email: 'Já existe conta com esse e-mail.' }, eco };
  }
  if (await handleEmUso(handle)) {
    return { erros: { handle: 'Esse @ já está em uso.' }, eco };
  }

  let criado;
  try {
    criado = await criarUsuario({ nome, handle, email, senha });
  } catch {
    // Corrida entre duas pessoas pedindo o mesmo @ ou e-mail ao mesmo tempo:
    // o indice unico do banco barra, e a mensagem sai limpa em vez de erro 500.
    return { erros: { email: 'Não foi possível criar a conta. Tente outro @ ou e-mail.' }, eco };
  }

  await criarSessao(criado.id);
  redirect('/studio');
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

/**
 * Conta um play. Chamado quando a faixa realmente comeca a tocar, nao no
 * clique: clicar e mudar de ideia nao e escuta.
 */
export async function contarPlay(beatId) {
  const id = Number(beatId);
  if (!Number.isInteger(id)) return;
  await sql`UPDATE beats SET plays = plays + 1 WHERE id = ${id}`;
}

/**
 * Favoritar e desfavoritar. O contador em beats.favoritos anda junto, na
 * mesma ida ao banco, para a tela nunca mostrar um numero que nao bate com a
 * lista de quem favoritou.
 */
export async function alternarFavorito(beatId) {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: 'entre' };

  const id = Number(beatId);
  if (!Number.isInteger(id)) return { erro: 'invalido' };

  const removeu = await sql`
    DELETE FROM favoritos WHERE usuario_id = ${usuario.id} AND beat_id = ${id}
    RETURNING beat_id
  `;

  if (removeu[0]) {
    // GREATEST evita contador negativo se algo ficar fora de sincronia.
    const r = await sql`
      UPDATE beats SET favoritos = GREATEST(favoritos - 1, 0)
      WHERE id = ${id} RETURNING favoritos
    `;
    return { favoritado: false, total: r[0]?.favoritos ?? 0 };
  }

  await sql`
    INSERT INTO favoritos (usuario_id, beat_id) VALUES (${usuario.id}, ${id})
    ON CONFLICT DO NOTHING
  `;
  const r = await sql`
    UPDATE beats SET favoritos = favoritos + 1 WHERE id = ${id} RETURNING favoritos
  `;
  return { favoritado: true, total: r[0]?.favoritos ?? 0 };
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
