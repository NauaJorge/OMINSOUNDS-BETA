import { sql } from './db.js';

/*
  Onde as respostas do onboarding viram consequência.

  Até aqui a plataforma perguntava o que a pessoa curte, para que procura beat
  e quem ela quer seguir — e não usava nenhuma das três respostas. Perguntar e
  ignorar é pior do que não perguntar: gasta a paciência de quem acabou de
  chegar e não devolve nada.
*/

/**
 * Como o objetivo declarado muda o que aparece primeiro.
 *
 * Quem vai lançar comercialmente precisa ver que existe Trackout e Exclusiva,
 * senão descobre tarde que a licença barata não cobre o uso dele. Quem só está
 * explorando precisa ver o que dá para ouvir sem pagar.
 */
export const AJUSTE_POR_OBJETIVO = {
  comercial: {
    titulo: 'Para projeto comercial',
    explica: 'Beats com licença Trackout ou Exclusiva, que cobrem uso comercial sem limite de execuções.',
    ordem: 'licenca_alta',
  },
  explorando: {
    titulo: 'Para começar a ouvir',
    explica: 'Beats liberados pelo produtor, para você conhecer o trabalho antes de comprar.',
    ordem: 'gratis',
  },
  musica: {
    titulo: 'Para gravar sua música',
    explica: 'Beats mais tocados nos estilos que você marcou.',
    ordem: 'tocados',
  },
  conteudo: {
    titulo: 'Para conteúdo e freestyle',
    explica: 'Beats de licença básica, suficientes para vídeo e rede social.',
    ordem: 'barato',
  },
};

// As colunas vão escritas por extenso em cada consulta. O driver do Neon não
// tem `sql.unsafe`, e interpolar pedaço de SQL como texto seria o caminho de
// abrir injeção — melhor repetir a lista.

function preparar(linhas) {
  return linhas.map((b) => ({ ...b, picos: JSON.parse(b.picos || '[]') }));
}

export function paraFila(beats) {
  return beats.map((b) => ({
    id: b.id, titulo: b.titulo, produtor: b.produtor, handle: b.handle,
    capa: b.capa_url, audio: b.audio_url, picos: b.picos, bpm: b.bpm, tom: b.tom,
  }));
}

/** Beats de quem a pessoa segue. É o que dá sentido ao último passo do fluxo. */
export async function deQuemSegue(usuarioId, limite = 12) {
  const linhas = await sql`
    SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.picos, b.bpm, b.tom,
           b.genero, b.mood, b.preco_centavos, b.plays, b.favoritos, b.tags, b.gratis,
           u.handle, u.nome AS produtor
    FROM beats b
    JOIN usuarios u ON u.id = b.produtor_id
    JOIN seguidores s ON s.seguido_id = b.produtor_id
    WHERE b.publicado AND s.seguidor_id = ${usuarioId}
    ORDER BY b.criado_em DESC, b.plays DESC
    LIMIT ${limite}
  `;
  return preparar(linhas);
}

/** Beats nos gêneros e moods que a pessoa marcou, sem repetir quem ela já segue. */
export async function peloGosto(usuarioId, limite = 12) {
  const linhas = await sql`
    SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.picos, b.bpm, b.tom,
           b.genero, b.mood, b.preco_centavos, b.plays, b.favoritos, b.tags, b.gratis,
           u.handle, u.nome AS produtor
    FROM beats b
    JOIN usuarios u ON u.id = b.produtor_id,
         LATERAL (SELECT preferencias_generos AS gen, preferencias_moods AS mood
                  FROM usuarios WHERE id = ${usuarioId}) p
    WHERE b.publicado
      AND (b.genero = ANY(p.gen) OR b.mood = ANY(p.mood))
      AND NOT EXISTS (
        SELECT 1 FROM seguidores s
        WHERE s.seguidor_id = ${usuarioId} AND s.seguido_id = b.produtor_id
      )
    ORDER BY b.plays DESC
    LIMIT ${limite}
  `;
  return preparar(linhas);
}

/** A faixa que responde ao objetivo declarado. */
export async function peloObjetivo(objetivo, limite = 8) {
  const ajuste = AJUSTE_POR_OBJETIVO[objetivo];
  if (!ajuste) return { ajuste: null, beats: [] };

  const ordem = ajuste.ordem;
  const linhas = await sql`
    SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.picos, b.bpm, b.tom,
           b.genero, b.mood, b.preco_centavos, b.plays, b.favoritos, b.tags, b.gratis,
           u.handle, u.nome AS produtor
    FROM beats b
    JOIN usuarios u ON u.id = b.produtor_id
    WHERE b.publicado
      AND (${ordem} <> 'gratis' OR b.gratis)
      AND (${ordem} <> 'licenca_alta' OR EXISTS (
            SELECT 1 FROM licencas l
            WHERE l.beat_id = b.id AND (l.exclusiva OR l.nome = 'Trackout')))
    ORDER BY
      CASE WHEN ${ordem} = 'barato' THEN b.preco_centavos END ASC,
      CASE WHEN ${ordem} = 'licenca_alta' THEN b.plays END DESC,
      b.plays DESC
    LIMIT ${limite}
  `;
  return { ajuste, beats: preparar(linhas) };
}

/** Fecha o feed quando as outras faixas vieram curtas. */
export async function paraCompletar(usuarioId, jaMostrados, limite = 8) {
  const ids = jaMostrados.length ? jaMostrados : [0];
  const linhas = await sql`
    SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.picos, b.bpm, b.tom,
           b.genero, b.mood, b.preco_centavos, b.plays, b.favoritos, b.tags, b.gratis,
           u.handle, u.nome AS produtor
    FROM beats b
    JOIN usuarios u ON u.id = b.produtor_id
    WHERE b.publicado AND NOT (b.id = ANY(${ids}))
    ORDER BY b.plays DESC
    LIMIT ${limite}
  `;
  return preparar(linhas);
}

export async function contarSeguindo(usuarioId) {
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM seguidores WHERE seguidor_id = ${usuarioId}
  `;
  return n;
}

export async function jaSegue(seguidorId, seguidoId) {
  const r = await sql`
    SELECT 1 FROM seguidores WHERE seguidor_id = ${seguidorId} AND seguido_id = ${seguidoId}
  `;
  return r.length > 0;
}

export async function contarSeguidores(usuarioId) {
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM seguidores WHERE seguido_id = ${usuarioId}
  `;
  return n;
}
