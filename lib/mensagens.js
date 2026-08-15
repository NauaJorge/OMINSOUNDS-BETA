import { sql } from './db.js';

/*
  REGRA CENTRAL DE SEGURANCA DESTE ARQUIVO

  Enquanto uma conversa esta 'pendente', o destinatario nao pode obter o corpo
  de nenhuma mensagem dela. Isso e garantido AQUI, nas consultas: a coluna
  `corpo` simplesmente nao e selecionada. Nao e "escondido no CSS", nao e um
  campo que a interface deixa de renderizar. Se um dia a interface tiver um bug,
  ou alguem chamar estas funcoes de outro lugar, o corpo continua sem sair do
  banco.

  Consequencia pratica: nao existe pre-visualizacao da mensagem na caixa de
  entrada. O destinatario ve QUEM quer falar e QUANDO pediu, e decide a partir
  disso. Foi decisao explicita do Diretor: "nunca a mensagem ja chega direto".

  Quem envia tambem nao consegue usar o pedido como canal: o unico texto livre
  que aparece antes do aceite seria o assunto, entao o assunto tambem fica
  retido. So depois do aceite o conteudo aparece, dos dois lados.
*/

const LIMITE_PEDIDOS_POR_DIA = 20;

/** Solicitacoes esperando resposta. Sem corpo, sem assunto — de proposito. */
export async function pedidosPendentes(usuarioId) {
  return sql`
    SELECT c.id,
           c.criado_em,
           u.handle,
           u.nome,
           u.avatar_url,
           u.cidade,
           (SELECT count(*) FROM mensagens m WHERE m.conversa_id = c.id) AS qtd_mensagens
    FROM conversas c
    JOIN usuarios u ON u.id = c.solicitante_id
    WHERE c.destinatario_id = ${usuarioId} AND c.situacao = 'pendente'
    ORDER BY c.criado_em DESC
  `;
}

/** Conversas ja aceitas, dos dois lados. Aqui sim pode vir previa. */
export async function conversasAceitas(usuarioId) {
  return sql`
    SELECT c.id,
           c.assunto,
           c.criado_em,
           u.handle,
           u.nome,
           u.avatar_url,
           (SELECT m.corpo FROM mensagens m
             WHERE m.conversa_id = c.id ORDER BY m.criado_em DESC LIMIT 1) AS ultima,
           (SELECT max(m.criado_em) FROM mensagens m
             WHERE m.conversa_id = c.id) AS ultima_em
    FROM conversas c
    JOIN usuarios u
      ON u.id = CASE WHEN c.solicitante_id = ${usuarioId}
                     THEN c.destinatario_id ELSE c.solicitante_id END
    WHERE (c.solicitante_id = ${usuarioId} OR c.destinatario_id = ${usuarioId})
      AND c.situacao = 'aceita'
    ORDER BY COALESCE((SELECT max(m.criado_em) FROM mensagens m
                       WHERE m.conversa_id = c.id), c.criado_em) DESC
  `;
}

/** Pedidos que EU enviei e ainda nao foram respondidos. */
export async function meusPedidosEnviados(usuarioId) {
  return sql`
    SELECT c.id, c.situacao, c.criado_em, u.handle, u.nome
    FROM conversas c
    JOIN usuarios u ON u.id = c.destinatario_id
    WHERE c.solicitante_id = ${usuarioId} AND c.situacao <> 'aceita'
    ORDER BY c.criado_em DESC
  `;
}

/**
 * Mensagens de uma conversa. So devolve algo se a conversa estiver aceita E
 * quem pediu fizer parte dela. Nos dois casos negativos devolve null, e nao
 * uma lista vazia, para a pagina saber diferenciar "sem mensagem" de
 * "voce nao pode ver isso".
 */
export async function mensagensDaConversa(conversaId, usuarioId) {
  const linhas = await sql`
    SELECT c.id, c.situacao, c.assunto,
           c.solicitante_id, c.destinatario_id,
           u.handle, u.nome, u.avatar_url
    FROM conversas c
    JOIN usuarios u
      ON u.id = CASE WHEN c.solicitante_id = ${usuarioId}
                     THEN c.destinatario_id ELSE c.solicitante_id END
    WHERE c.id = ${conversaId}
      AND (c.solicitante_id = ${usuarioId} OR c.destinatario_id = ${usuarioId})
  `;
  const conversa = linhas[0];
  if (!conversa) return null;
  if (conversa.situacao !== 'aceita') return null;

  const mensagens = await sql`
    SELECT m.id, m.autor_id, m.corpo, m.criado_em
    FROM mensagens m
    WHERE m.conversa_id = ${conversaId}
    ORDER BY m.criado_em ASC
  `;
  return { conversa, mensagens };
}

/**
 * Abre um pedido de conversa. Se ja existir um pedido meu para essa pessoa,
 * nao cria outro — evita usar reenvio como forma de furar o aceite mandando
 * varios pedidos seguidos.
 */
export async function abrirPedido({ deId, paraHandle, assunto, corpo }) {
  const alvo = await sql`SELECT id FROM usuarios WHERE handle = ${paraHandle}`;
  if (!alvo[0]) return { erro: 'Produtor nao encontrado.' };
  const paraId = alvo[0].id;
  if (paraId === deId) return { erro: 'Voce nao pode mandar mensagem para voce mesmo.' };

  const [{ count }] = await sql`
    SELECT count(*)::int AS count FROM conversas
    WHERE solicitante_id = ${deId} AND criado_em > now() - interval '1 day'
  `;
  if (count >= LIMITE_PEDIDOS_POR_DIA) {
    return { erro: 'Voce atingiu o limite de pedidos por dia.' };
  }

  const jaExiste = await sql`
    SELECT id, situacao FROM conversas
    WHERE solicitante_id = ${deId} AND destinatario_id = ${paraId}
  `;
  if (jaExiste[0]) {
    if (jaExiste[0].situacao === 'recusada') {
      return { erro: 'Esta pessoa recusou seu pedido.' };
    }
    return { erro: 'Voce ja tem um pedido aberto com esta pessoa.', id: jaExiste[0].id };
  }

  const criada = await sql`
    INSERT INTO conversas (solicitante_id, destinatario_id, assunto)
    VALUES (${deId}, ${paraId}, ${assunto ?? ''})
    RETURNING id
  `;
  await sql`
    INSERT INTO mensagens (conversa_id, autor_id, corpo)
    VALUES (${criada[0].id}, ${deId}, ${corpo})
  `;
  return { ok: true, id: criada[0].id };
}

/**
 * Aceitar ou recusar. So o destinatario pode, e so enquanto esta pendente —
 * as duas condicoes vao no WHERE, entao nao ha como responder o pedido de
 * outra pessoa nem reabrir algo ja respondido mexendo no id da requisicao.
 */
export async function responderPedido({ conversaId, usuarioId, aceitar }) {
  const situacao = aceitar ? 'aceita' : 'recusada';
  const linhas = await sql`
    UPDATE conversas
    SET situacao = ${situacao}, respondido_em = now()
    WHERE id = ${conversaId}
      AND destinatario_id = ${usuarioId}
      AND situacao = 'pendente'
    RETURNING id
  `;
  return linhas.length > 0;
}

/** Responder dentro de uma conversa ja aceita. */
export async function responderNaConversa({ conversaId, usuarioId, corpo }) {
  const permitido = await sql`
    SELECT id FROM conversas
    WHERE id = ${conversaId}
      AND situacao = 'aceita'
      AND (solicitante_id = ${usuarioId} OR destinatario_id = ${usuarioId})
  `;
  if (!permitido[0]) return false;

  await sql`
    INSERT INTO mensagens (conversa_id, autor_id, corpo)
    VALUES (${conversaId}, ${usuarioId}, ${corpo})
  `;
  return true;
}

export async function contarPendentes(usuarioId) {
  const [{ count }] = await sql`
    SELECT count(*)::int AS count FROM conversas
    WHERE destinatario_id = ${usuarioId} AND situacao = 'pendente'
  `;
  return count;
}
