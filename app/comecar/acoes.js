'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { usuarioAtual } from '../../lib/sessao';
import {
  definirPapel, salvarGosto, salvarObjetivo, salvarVitrine,
  concluir, alternarSeguir, virarProdutor,
  proximoPasso, destinoFinal,
} from '../../lib/onboarding';

/** Toda ação daqui exige sessão. Sem isso não há a quem salvar nada. */
async function exigirSessao() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  return usuario;
}

function avancar(papel, passoAtual) {
  const proximo = proximoPasso(papel, passoAtual);
  redirect(proximo ? `/comecar/${proximo}` : destinoFinal(papel));
}

export async function escolherPapel(dadosForm) {
  const usuario = await exigirSessao();
  const papel = String(dadosForm.get('papel') ?? '');
  if (!(await definirPapel(usuario.id, papel))) redirect('/comecar');

  // O menu muda conforme o papel, então precisa ser refeito.
  revalidatePath('/', 'layout');
  redirect(`/comecar/${papel === 'artista' ? 'gosto' : 'vitrine'}`);
}

export async function guardarGosto(dadosForm) {
  const usuario = await exigirSessao();
  await salvarGosto(usuario.id, {
    generos: dadosForm.getAll('genero').map(String),
    moods: dadosForm.getAll('mood').map(String),
  });
  avancar('artista', 'gosto');
}

export async function guardarObjetivo(dadosForm) {
  const usuario = await exigirSessao();
  await salvarObjetivo(usuario.id, String(dadosForm.get('objetivo') ?? ''));
  avancar('artista', 'objetivo');
}

export async function guardarVitrine(dadosForm) {
  const usuario = await exigirSessao();
  await salvarVitrine(usuario.id, {
    bio: String(dadosForm.get('bio') ?? ''),
    cidade: String(dadosForm.get('cidade') ?? ''),
    generos: dadosForm.getAll('genero').map(String),
  });
  avancar('produtor', 'vitrine');
}

/** Seguir fora do onboarding, pelo perfil do produtor. */
export async function seguirProdutor(produtorId) {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: 'entre' };

  const alvo = Number(produtorId);
  if (!Number.isInteger(alvo)) return { erro: 'invalido' };

  const r = await alternarSeguir(usuario.id, alvo);
  if (r.erro) return r;

  revalidatePath('/feed');
  return r;
}

export async function seguirNoOnboarding(dadosForm) {
  const usuario = await exigirSessao();
  const alvo = Number(dadosForm.get('produtor'));
  if (Number.isInteger(alvo)) await alternarSeguir(usuario.id, alvo);
  revalidatePath('/comecar/seguir');
}

/** Fecha o onboarding. Serve tanto para "concluir" quanto para "fazer depois". */
export async function terminar(dadosForm) {
  const usuario = await exigirSessao();
  await concluir(usuario.id);
  revalidatePath('/', 'layout');
  redirect(String(dadosForm?.get('destino') || destinoFinal(usuario.papel)));
}

export async function passarAVender() {
  const usuario = await exigirSessao();
  if (!(await virarProdutor(usuario.id))) redirect('/studio');
  revalidatePath('/', 'layout');
  redirect('/comecar/vitrine');
}
