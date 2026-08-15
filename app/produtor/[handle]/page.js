import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '../../../lib/db';
import { usuarioAtual } from '../../../lib/sessao';
import FormularioPedido from './FormularioPedido';
import BotaoTocar from '../../player/BotaoTocar';

export const dynamic = 'force-dynamic';

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function desde(data) {
  return new Date(data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const linhas = await sql`SELECT nome, bio FROM usuarios WHERE handle = ${handle}`;
  if (!linhas[0]) return { title: 'Produtor | OMINSOUNDS' };
  return {
    title: `${linhas[0].nome} | OMINSOUNDS`,
    description: linhas[0].bio,
  };
}

export default async function Produtor({ params }) {
  const { handle } = await params;
  const linhas = await sql`
    SELECT id, handle, nome, bio, cidade, avatar_url, capa_url, criado_em
    FROM usuarios WHERE handle = ${handle}
  `;
  const produtor = linhas[0];
  if (!produtor) notFound();

  const beats = await sql`
    SELECT id, titulo, capa_url, audio_url, bpm, tom, genero, mood, preco_centavos, plays, favoritos
    FROM beats WHERE produtor_id = ${produtor.id} AND publicado
    ORDER BY plays DESC
  `;

  const totalPlays = beats.reduce((s, b) => s + b.plays, 0);
  const totalFavoritos = beats.reduce((s, b) => s + b.favoritos, 0);
  const generos = [...new Set(beats.map((b) => b.genero).filter(Boolean))];
  const moods = [...new Set(beats.map((b) => b.mood).filter(Boolean))];

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

  const faixaDe = (b) => ({
    id: b.id, titulo: b.titulo, produtor: produtor.nome,
    handle: produtor.handle, capa: b.capa_url, audio: b.audio_url,
  });

  return (
    <>
      <header className="perfil-capa">
        {produtor.capa_url && (
          <img className="perfil-capa-img" src={produtor.capa_url} alt="" width="1600" height="500" />
        )}
        <div className="perfil-capa-veu" aria-hidden="true" />
      </header>

      <div className="container">
        <div className="perfil-topo">
          <img
            className="perfil-avatar"
            src={produtor.avatar_url || '/assents/img/user-circle.svg'}
            alt=""
            width="120"
            height="120"
          />
          <div className="perfil-identidade">
            <h1>{produtor.nome}</h1>
            <p className="mini" style={{ margin: 0 }}>
              @{produtor.handle}
              {produtor.cidade ? ` · ${produtor.cidade}` : ''}
              {` · na plataforma desde ${desde(produtor.criado_em)}`}
            </p>
          </div>

          <div className="perfil-numeros">
            <div><strong>{beats.length}</strong><span>beats</span></div>
            <div><strong>{totalPlays.toLocaleString('pt-BR')}</strong><span>plays</span></div>
            <div><strong>{totalFavoritos.toLocaleString('pt-BR')}</strong><span>favoritos</span></div>
          </div>
        </div>

        <div className="perfil-grade">
          <div>
            <p className="leve" style={{ maxWidth: '58ch' }}>{produtor.bio}</p>

            {(generos.length > 0 || moods.length > 0) && (
              <div className="beat-meta" style={{ marginTop: 16 }}>
                {generos.map((g) => (
                  <Link className="etiqueta" key={g} href={`/beats?genero=${encodeURIComponent(g)}`}>{g}</Link>
                ))}
                {moods.map((m) => <span className="etiqueta" key={m}>{m}</span>)}
              </div>
            )}

            <section style={{ marginTop: 34 }}>
              {/* A contagem sai daqui: ja aparece no bloco de numeros la em
                  cima e a lista e numerada. Solta na ponta direita ela so
                  ficava boiando longe do titulo. */}
              <h2 style={{ fontSize: 22, marginBottom: 14 }}>Catálogo</h2>

              {beats.length === 0 ? (
                <p className="vazio">Nenhum beat publicado ainda.</p>
              ) : (
                <ol className="lista-beats">
                  {beats.map((b, i) => (
                    <li className="linha-beat" key={b.id}>
                      <span className="linha-num mini">{String(i + 1).padStart(2, '0')}</span>

                      <div className="linha-capa">
                        <img src={b.capa_url} alt="" width="56" height="56" loading="lazy" />
                        <BotaoTocar faixa={faixaDe(b)} />
                      </div>

                      <div className="linha-titulo">
                        <strong>{b.titulo}</strong>
                        <span className="mini">{b.genero} · {b.mood}</span>
                      </div>

                      <span className="linha-tec mini">{b.bpm} BPM · {b.tom}</span>
                      <span className="linha-plays mini">{b.plays.toLocaleString('pt-BR')} plays</span>
                      <span className="preco linha-preco">{real(b.preco_centavos)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <aside className="perfil-lado">
            <div className="cartao">
              <div className="cartao-corpo">
                <h2 style={{ fontSize: 19 }}>Falar com {produtor.nome.split(' ')[0]}</h2>

                {souEu ? (
                  <p className="leve" style={{ fontSize: 14.5, marginBottom: 0 }}>
                    Este é o seu perfil público. É assim que os artistas te veem.
                  </p>
                ) : !visitante ? (
                  <>
                    <p className="leve" style={{ fontSize: 14.5 }}>
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
                    <p className="leve" style={{ fontSize: 14.5 }}>Vocês já estão conversando.</p>
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

            <div className="cartao" style={{ marginTop: 14 }}>
              <div className="cartao-corpo">
                <h3>Licenças</h3>
                <p className="leve" style={{ fontSize: 14.5, marginBottom: 0 }}>
                  O valor de cada beat é a licença básica. Exclusiva e uso comercial
                  ampliado são combinados direto com {produtor.nome.split(' ')[0]}.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
