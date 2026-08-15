import { sql } from './db.js';
import { gerarHash } from './senha.js';
import { normalizarHandle } from './handle.js';

export { normalizarHandle };

const RESERVADOS = new Set([
  'admin', 'administrador', 'root', 'suporte', 'ajuda', 'contato', 'api',
  'beats', 'produtor', 'produtores', 'studio', 'mensagens', 'planos',
  'entrar', 'cadastrar', 'sair', 'conta', 'ominisounds', 'omin', 'sobre',
]);


export function validarCadastro({ nome, handle, email, senha }) {
  const erros = {};

  if (!nome || nome.trim().length < 2) erros.nome = 'Escreva seu nome ou nome artístico.';
  if (nome && nome.trim().length > 60) erros.nome = 'Nome muito longo.';

  if (!handle || handle.length < 3) erros.handle = 'O @ precisa de pelo menos 3 caracteres.';
  else if (handle.length > 20) erros.handle = 'O @ pode ter no máximo 20 caracteres.';
  else if (!/^[a-z0-9_]+$/.test(handle)) erros.handle = 'Use só letras, números e _ no @.';
  else if (RESERVADOS.has(handle)) erros.handle = 'Esse @ é reservado pela plataforma.';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erros.email = 'E-mail inválido.';

  if (!senha || senha.length < 8) erros.senha = 'A senha precisa de pelo menos 8 caracteres.';
  else if (senha.length > 200) erros.senha = 'Senha longa demais.';
  else if (/^\d+$/.test(senha)) erros.senha = 'Só números é fácil demais de adivinhar.';

  return erros;
}

/** Sugere um @ livre a partir de um texto qualquer. Usado no login pelo Google. */
export async function handleLivre(base) {
  let raiz = normalizarHandle(base).slice(0, 16) || 'produtor';
  if (raiz.length < 3) raiz = `${raiz}bea`.slice(0, 3);

  for (let i = 0; i < 50; i++) {
    const tentativa = i === 0 ? raiz : `${raiz}${i + 1}`;
    const existe = await sql`SELECT 1 FROM usuarios WHERE handle = ${tentativa}`;
    if (!existe[0] && !RESERVADOS.has(tentativa)) return tentativa;
  }
  return `${raiz}${Date.now().toString(36).slice(-4)}`;
}

export async function emailEmUso(email) {
  const r = await sql`SELECT 1 FROM usuarios WHERE lower(email) = ${email.toLowerCase()}`;
  return !!r[0];
}

export async function handleEmUso(handle) {
  const r = await sql`SELECT 1 FROM usuarios WHERE handle = ${handle}`;
  return !!r[0];
}

export async function criarUsuario({ nome, handle, email, senha, googleSub, avatarUrl, emailVerificado }) {
  const hash = senha ? await gerarHash(senha) : null;
  const linhas = await sql`
    INSERT INTO usuarios (nome, handle, email, senha_hash, papel, google_sub, avatar_url, email_verificado)
    VALUES (${nome.trim()}, ${handle}, ${email.toLowerCase()}, ${hash}, 'produtor',
            ${googleSub ?? null}, ${avatarUrl ?? ''}, ${emailVerificado ?? false})
    RETURNING id, handle, nome
  `;
  return linhas[0];
}

/**
 * Encontra ou cria a conta a partir do perfil que o Google devolveu.
 * Se o e-mail ja existe com senha, so amarra o google_sub naquela conta em vez
 * de criar uma segunda — senao a pessoa acabaria com duas contas e metade do
 * catalogo em cada.
 */
export async function acharOuCriarPeloGoogle({ sub, email, nome, foto }) {
  const porSub = await sql`SELECT id FROM usuarios WHERE google_sub = ${sub}`;
  if (porSub[0]) return porSub[0].id;

  const porEmail = await sql`SELECT id FROM usuarios WHERE lower(email) = ${email.toLowerCase()}`;
  if (porEmail[0]) {
    await sql`
      UPDATE usuarios SET google_sub = ${sub}, email_verificado = true
      WHERE id = ${porEmail[0].id}
    `;
    return porEmail[0].id;
  }

  const handle = await handleLivre(email.split('@')[0] || nome);
  const criado = await criarUsuario({
    nome: nome || handle,
    handle,
    email,
    senha: null,
    googleSub: sub,
    avatarUrl: foto || '',
    emailVerificado: true,
  });
  return criado.id;
}

export function googleConfigurado() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
