import Link from 'next/link';
import { sql } from '../lib/db';
import BotaoTocar from './player/BotaoTocar';

export const dynamic = 'force-dynamic';

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function Home() {
  const destaques = await sql`
    SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.bpm, b.genero, b.mood, b.preco_centavos,
           u.handle, u.nome AS produtor
    FROM beats b JOIN usuarios u ON u.id = b.produtor_id
    WHERE b.publicado
    ORDER BY b.plays DESC
    LIMIT 4
  `;
  const produtores = await sql`
    SELECT handle, nome, bio, cidade, avatar_url,
           (SELECT count(*)::int FROM beats WHERE produtor_id = usuarios.id) AS qtd
    FROM usuarios WHERE papel = 'produtor' ORDER BY nome
  `;

  return (
    <>
      <section className="palco">
        {/* Video de fundo: mudo, em laco, sem controles e marcado como
            decorativo. preload="none" e o poster seguram a banda ate o
            navegador decidir tocar; quem pediu menos animacao nao recebe. */}
        <video
          className="palco-video"
          src="/assents/video/estudio-loop.mp4"
          poster="/assents/img/studio1.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="palco-veu" aria-hidden="true" />

        <div className="container palco-conteudo">
          <span className="olho">Marketplace de beats</span>
          <h1 style={{ maxWidth: '15ch' }}>
            Tecnologia a serviço do ouvido de quem produz.
          </h1>
          <p className="leve" style={{ maxWidth: '58ch', fontSize: 19 }}>
            Um marketplace onde o beat chega antes do discurso, o produtor controla
            a própria vitrine e ninguém consegue falar com você sem a sua permissão.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            <Link className="btn btn-ouro" href="/beats">Ouvir o catálogo</Link>
            <Link className="btn btn-linha" href="/entrar">Entrar no Studio</Link>
          </div>
        </div>
      </section>

      <section className="container secao" style={{ paddingTop: 0 }}>
        <div className="grade grade-3">
          <div className="cartao"><div className="cartao-corpo">
            <span className="olho">01</span>
            <h3>Vitrine que é sua</h3>
            <p className="leve" style={{ margin: 0, fontSize: 15 }}>
              Cada produtor entra e encontra o próprio catálogo, os próprios
              números e a própria caixa de entrada. Nada de painel compartilhado.
            </p>
          </div></div>
          <div className="cartao"><div className="cartao-corpo">
            <span className="olho">02</span>
            <h3>Mensagem com aceite</h3>
            <p className="leve" style={{ margin: 0, fontSize: 15 }}>
              A mensagem nunca chega direto. Você vê quem quer falar e decide.
              O texto só sai do banco depois do seu aceite.
            </p>
          </div></div>
          <div className="cartao"><div className="cartao-corpo">
            <span className="olho">03</span>
            <h3>Sem intermediário no gosto</h3>
            <p className="leve" style={{ margin: 0, fontSize: 15 }}>
              Busca por BPM, tom, gênero e mood. O artista acha o beat pelo que
              ele é, não por quem pagou mais para aparecer.
            </p>
          </div></div>
        </div>
      </section>

      <section className="container secao">
        <div className="secao-titulo">
          <h2>Mais tocados</h2>
          <Link className="btn btn-fantasma" href="/beats">Ver tudo</Link>
        </div>
        <div className="grade grade-4">
          {destaques.map((b) => (
            <article className="cartao" key={b.id}>
              <div className="capa-com-play">
                <img className="beat-capa" src={b.capa_url} alt="" width="600" height="600" loading="lazy" />
                <BotaoTocar
                  faixa={{
                    id: b.id, titulo: b.titulo, produtor: b.produtor,
                    handle: b.handle, capa: b.capa_url, audio: b.audio_url,
                  }}
                />
              </div>
              <div className="cartao-corpo">
                <h3 style={{ marginBottom: 2 }}>{b.titulo}</h3>
                <Link className="mini" href={`/produtor/${b.handle}`}>{b.produtor}</Link>
                <div className="beat-meta">
                  <span className="etiqueta">{b.bpm} BPM</span>
                  <span className="etiqueta">{b.genero}</span>
                </div>
                <p className="preco" style={{ marginBottom: 0, marginTop: 12 }}>{real(b.preco_centavos)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container secao" style={{ paddingTop: 0 }}>
        <div className="secao-titulo"><h2>Produtores</h2></div>
        <div className="grade grade-3">
          {produtores.map((p) => (
            <Link className="cartao" href={`/produtor/${p.handle}`} key={p.handle} style={{ textDecoration: 'none' }}>
              <div className="cartao-corpo">
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <img className="avatar" src={p.avatar_url || '/assents/img/user-circle.svg'} alt="" width="46" height="46" />
                  <div>
                    <strong>{p.nome}</strong>
                    <div className="mini">@{p.handle} · {p.qtd} {p.qtd === 1 ? 'beat' : 'beats'}</div>
                  </div>
                </div>
                <p className="leve" style={{ fontSize: 14.5, marginBottom: 0, marginTop: 14 }}>{p.bio}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
