import { sql } from './db.js';

/*
  As perguntas do onboarding e o que fazer com as respostas.

  Regra que vale para tudo aqui: nenhuma resposta é obrigatória a partir do
  passo 2. O cadastro já pediu o indispensável, e formulário longo na primeira
  visita é o jeito mais rápido de perder alguém que ainda não viu valor.
*/

export const PASSOS = {
  artista: ['gosto', 'objetivo', 'seguir'],
  produtor: ['vitrine', 'como-funciona', 'primeiro-beat'],
};

export const OBJETIVOS = [
  { valor: 'musica',    titulo: 'Gravar uma música minha',                    ajuda: 'Quero um beat para cantar ou rimar por cima.' },
  { valor: 'conteudo',  titulo: 'Fazer freestyle e conteúdo',                 ajuda: 'Vídeo, rede social, prática.' },
  { valor: 'comercial', titulo: 'Projeto comercial, publicidade ou trilha',   ajuda: 'Preciso de licença que cubra uso comercial.' },
  { valor: 'explorando', titulo: 'Ainda estou explorando',                    ajuda: 'Cheguei agora, quero ouvir.' },
];

/** Passo seguinte, ou null quando acabou. */
export function proximoPasso(papel, atual) {
  const lista = PASSOS[papel] ?? [];
  const i = lista.indexOf(atual);
  if (i === -1 || i === lista.length - 1) return null;
  return lista[i + 1];
}

export function posicaoDoPasso(papel, atual) {
  const lista = PASSOS[papel] ?? [];
  const i = lista.indexOf(atual);
  // +1 porque o passo 1 é a escolha de papel, comum aos dois caminhos.
  return { atual: i + 2, total: lista.length + 1 };
}

/** Para onde a pessoa vai quando termina ou pula. */
export function destinoFinal(papel) {
  // Artista cai no feed: e la que as respostas do onboarding aparecem.
  // Mandar para o catalogo geral faria as tres perguntas nao valerem nada.
  return papel === 'artista' ? '/feed' : '/studio';
}

export async function definirPapel(usuarioId, papel) {
  if (!['artista', 'produtor'].includes(papel)) return false;
  await sql`UPDATE usuarios SET papel = ${papel} WHERE id = ${usuarioId}`;
  return true;
}

export async function salvarGosto(usuarioId, { generos, moods }) {
  await sql`
    UPDATE usuarios
    SET preferencias_generos = ${generos ?? []},
        preferencias_moods = ${moods ?? []}
    WHERE id = ${usuarioId}
  `;
}

export async function salvarObjetivo(usuarioId, objetivo) {
  const valido = OBJETIVOS.some((o) => o.valor === objetivo) ? objetivo : '';
  await sql`UPDATE usuarios SET objetivo = ${valido} WHERE id = ${usuarioId}`;
}

export async function salvarVitrine(usuarioId, { bio, cidade, generos }) {
  await sql`
    UPDATE usuarios
    SET bio = ${(bio ?? '').slice(0, 400)},
        cidade = ${(cidade ?? '').slice(0, 80)},
        preferencias_generos = ${generos ?? []}
    WHERE id = ${usuarioId}
  `;
}

export async function concluir(usuarioId) {
  await sql`UPDATE usuarios SET onboarding_em = now() WHERE id = ${usuarioId}`;
}

export async function precisaDeOnboarding(usuarioId) {
  const r = await sql`SELECT onboarding_em FROM usuarios WHERE id = ${usuarioId}`;
  return r[0] ? r[0].onboarding_em === null : false;
}

/** Gêneros e moods que existem de fato no catálogo, para não oferecer vazio. */
export async function opcoesDoCatalogo() {
  const r = await sql`
    SELECT
      array_agg(DISTINCT genero) FILTER (WHERE genero <> '') AS generos,
      array_agg(DISTINCT mood)   FILTER (WHERE mood   <> '') AS moods
    FROM beats WHERE publicado
  `;
  return { generos: r[0]?.generos ?? [], moods: r[0]?.moods ?? [] };
}

/**
 * Produtores para sugerir, com o que já é seguido marcado. Ordena por plays,
 * porque quem nunca ouviu nada precisa de um ponto de partida — e não de uma
 * lista alfabética.
 */
export async function produtoresParaSeguir(usuarioId) {
  return sql`
    SELECT u.id, u.handle, u.nome, u.bio, u.avatar_url,
           (SELECT count(*)::int FROM beats b WHERE b.produtor_id = u.id AND b.publicado) AS qtd,
           COALESCE((SELECT sum(b.plays)::int FROM beats b WHERE b.produtor_id = u.id), 0) AS plays,
           EXISTS (SELECT 1 FROM seguidores s WHERE s.seguidor_id = ${usuarioId} AND s.seguido_id = u.id) AS seguindo,
           (SELECT array_agg(DISTINCT b.genero) FROM beats b
             WHERE b.produtor_id = u.id AND b.genero <> '') AS generos
    FROM usuarios u
    WHERE u.papel = 'produtor'
      AND u.id <> ${usuarioId}
      -- Só quem tem beat publicado. Sugerir perfil vazio faz a pessoa seguir
      -- alguém que nunca vai encher o feed dela, que é justamente o que este
      -- passo existe para evitar.
      AND EXISTS (SELECT 1 FROM beats b WHERE b.produtor_id = u.id AND b.publicado)
    ORDER BY plays DESC, u.nome
    LIMIT 12
  `;
}

export async function alternarSeguir(seguidorId, seguidoId) {
  if (seguidorId === seguidoId) return { erro: 'nao-a-si-mesmo' };

  const removeu = await sql`
    DELETE FROM seguidores
    WHERE seguidor_id = ${seguidorId} AND seguido_id = ${seguidoId}
    RETURNING seguido_id
  `;
  if (removeu[0]) return { seguindo: false };

  await sql`
    INSERT INTO seguidores (seguidor_id, seguido_id)
    VALUES (${seguidorId}, ${seguidoId})
    ON CONFLICT DO NOTHING
  `;
  return { seguindo: true };
}

/** Vira produtor sem perder nada: o "Quero vender também" do menu. */
export async function virarProdutor(usuarioId) {
  const r = await sql`
    UPDATE usuarios SET papel = 'produtor'
    WHERE id = ${usuarioId} AND papel = 'artista'
    RETURNING handle
  `;
  return r.length > 0;
}
