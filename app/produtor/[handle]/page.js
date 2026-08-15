import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '../../../lib/db';
import { usuarioAtual } from '../../../lib/sessao';
import FormularioPedido from './FormularioPedido';

export const dynamic = 'force-dynamic';

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function Produtor({ params }) {
  const { handle } = await params;
  const linhas = await sql`
    SELECT id, handle, nome, bio, cidade, avatar_url
    FROM usuarios WHERE handle = ${handle}
  `;
  const produtor = linhas[0];
  if (!produtor) notFound();

  const beats = await sql`
    SELECT id, titulo, capa_url, audio_url, bpm, tom, genero, mood, preco_centavos, plays
    FROM beats WHERE produtor_id = ${produtor.id} AND publicado
    ORDER BY plays DESC
  `;

  const visitante = await usuarioAtual();
  const souEu = visitante?.id === produtor.id;

  let jaTemPedido = false;
  if (visitante && !souEu) {
    const p = await sql`
      SELECT situacao FROM conversas
      WHERE solicitante_id = ${visitante.id} AND destinatario_id = ${produtor.id}
    `;
    jaTemPedido = p[0]?.situacao ?? false;
  }

  return (
    <div className="container secao">
      <div className="grade grade-2" style={{ gap: 40, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              className="avatar"
              src={produtor.avatar_url || '/assents/img/user-circle.svg'}
              alt=""
              width="72"
              height="72"
              style={{ width: 72, height: 72 }}
            />
            <div>
              <span className="olho" style={{ marginBottom: 4 }}>Produtor</span>
              <h1 style={{ fontSize: 34, marginBottom: 2 }}>{produtor.nome}</h1>
              <p className="mini" style={{ margin: 0 }}>
                @{produtor.handle}{produtor.cidade ? ` · ${produtor.cidade}` : ''}
              </p>
            </div>
          </div>
          <p className="leve" style={{ marginTop: 20, maxWidth: '56ch' }}>{produtor.bio}</p>
        </div>

        <div className="cartao">
          <div className="cartao-corpo">
            <h2 style={{ fontSize: 20 }}>Falar com {produtor.nome.split(' ')[0]}</h2>

            {souEu ? (
              <p className="leve" style={{ fontSize: 15 }}>
                Este é o seu perfil público. É assim que os artistas te veem.
              </p>
            ) : !visitante ? (
              <>
                <p className="leve" style={{ fontSize: 15 }}>
                  Entre para enviar um pedido de conversa.
                </p>
                <Link className="btn btn-ouro btn-bloco" href="/entrar">Entrar</Link>
              </>
            ) : jaTemPedido === 'pendente' ? (
              <p className="aviso aviso-ok" style={{ margin: 0 }}>
                Seu pedido já foi enviado e está esperando o aceite.
              </p>
            ) : jaTemPedido === 'aceita' ? (
              <>
                <p className="leve" style={{ fontSize: 15 }}>Vocês já estão conversando.</p>
                <Link className="btn btn-linha btn-bloco" href="/mensagens">Abrir mensagens</Link>
              </>
            ) : jaTemPedido === 'recusada' ? (
              <p className="aviso" style={{ margin: 0 }}>
                Esta pessoa recusou seu pedido de conversa.
              </p>
            ) : (
              <FormularioPedido handle={produtor.handle} nome={produtor.nome} />
            )}
          </div>
        </div>
      </div>

      <section className="secao" style={{ paddingBottom: 0 }}>
        <div className="secao-titulo">
          <h2>Catálogo</h2>
          <span className="mini">{beats.length} {beats.length === 1 ? 'beat' : 'beats'}</span>
        </div>
        {beats.length === 0 ? (
          <p className="vazio">Nenhum beat publicado ainda.</p>
        ) : (
          <div className="grade grade-3">
            {beats.map((b) => (
              <article className="cartao" key={b.id}>
                <img className="beat-capa" src={b.capa_url} alt="" width="600" height="600" loading="lazy" />
                <div className="cartao-corpo">
                  <h3 style={{ marginBottom: 2 }}>{b.titulo}</h3>
                  <p className="mini" style={{ margin: 0 }}>{b.bpm} BPM · {b.tom}</p>
                  <div className="beat-meta">
                    <span className="etiqueta">{b.genero}</span>
                    <span className="etiqueta">{b.mood}</span>
                  </div>
                  <audio controls preload="none" src={b.audio_url} style={{ width: '100%', marginTop: 12 }}>
                    Seu navegador não conseguiu tocar este áudio.
                  </audio>
                  <p className="preco" style={{ marginBottom: 0, marginTop: 12 }}>{real(b.preco_centavos)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
