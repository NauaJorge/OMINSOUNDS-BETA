import Link from 'next/link';
import { sql } from '../lib/db';
import BotaoTocar from './player/BotaoTocar';
import Carrossel from './componentes/Carrossel';
import Vitrola from './componentes/Vitrola';

export const dynamic = 'force-dynamic';

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const IMAGENS_MAIS_TOCADOS = {
  'Noite Alta': '/assents/img/artistas/matue.jpg',
  'Rota 21': '/assents/img/artistas/teto.jpg',
  Vitrine: '/assents/img/artistas/cabelinho.jpg',
  'Sol de Verão': '/assents/img/artistas/burna-boy.jpg',
  Calor: '/assents/img/artistas/bad-bunny.jpg',
};

function imagemMaisTocado(beat) {
  return IMAGENS_MAIS_TOCADOS[beat.titulo] || beat.capa_url;
}

export default async function Home() {
  const destaques = await sql`
    SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.picos, b.bpm, b.tom, b.genero, b.mood, b.preco_centavos,
           u.handle, u.nome AS produtor
    FROM beats b JOIN usuarios u ON u.id = b.produtor_id
    WHERE b.publicado
    ORDER BY b.plays DESC
    LIMIT 10
  `;
  const destaquesComPicos = destaques.map((b) => ({ ...b, picos: JSON.parse(b.picos || '[]') }));
  const filaHome = destaquesComPicos.map((b) => ({
    id: b.id, titulo: b.titulo, produtor: b.produtor, handle: b.handle,
    capa: b.capa_url, audio: b.audio_url, picos: b.picos,
    bpm: b.bpm, tom: b.tom,
  }));

  const estilos = await sql`
    SELECT genero, count(*)::int AS qtd
    FROM beats WHERE publicado AND genero <> ''
    GROUP BY genero ORDER BY qtd DESC, genero
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

      <section className="container secao" style={{ paddingTop: 0 }}>
        <div className="descubra">
          <div>
            <span className="olho">Descubra novos sons</span>
            <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 40px)' }}>
              Type beats de todos os estilos.
            </h2>
            <p className="leve" style={{ maxWidth: '46ch' }}>
              Do que toca em todo lugar ao que ainda está no subsolo. Cada
              estilo abre o catálogo já filtrado, com o beat tocando enquanto
              você navega.
            </p>

            <div className="beat-meta" style={{ marginTop: 20 }}>
              {estilos.map((e) => (
                <Link className="etiqueta" href={`/beats?genero=${encodeURIComponent(e.genero)}`} key={e.genero}>
                  {e.genero} <span className="mini">{e.qtd}</span>
                </Link>
              ))}
            </div>

            <Link className="btn btn-linha" href="/beats" style={{ marginTop: 22 }}>
              Ver o catálogo inteiro
            </Link>
          </div>

          <Vitrola />
        </div>
      </section>

      <section className="container secao">
        <Carrossel
          titulo="Mais tocados"
          rotulo="Beats mais tocados"
          acao={<Link className="btn btn-fantasma" href="/beats">Ver tudo</Link>}
        >
          {destaquesComPicos.map((b) => (
            <article className="cartao carrossel-item" key={b.id}>
              <div className="capa-com-play">
                <img className="beat-capa" src={imagemMaisTocado(b)} alt="" width="600" height="600" loading="lazy" />
                <BotaoTocar
                  faixa={{
                    id: b.id, titulo: b.titulo, produtor: b.produtor,
                    handle: b.handle, capa: b.capa_url, audio: b.audio_url,
                    picos: b.picos, bpm: b.bpm, tom: b.tom,
                  }}
                  lista={filaHome}
                />
              </div>
              <div className="cartao-corpo">
                <h3 style={{ marginBottom: 2 }}><Link className="linha-link" href={`/beat/${b.id}`}>{b.titulo}</Link></h3>
                <Link className="mini" href={`/produtor/${b.handle}`}>{b.produtor}</Link>
                <div className="beat-meta">
                  <span className="etiqueta">{b.bpm} BPM</span>
                  <span className="etiqueta">{b.genero}</span>
                </div>
                <p className="preco" style={{ marginBottom: 0, marginTop: 12 }}>{real(b.preco_centavos)}</p>
              </div>
            </article>
          ))}
        </Carrossel>
      </section>

      <section className="container secao" style={{ paddingTop: 0 }}>
        <Carrossel
          titulo="Produtores"
          rotulo="Produtores da plataforma"
          acao={<Link className="btn btn-fantasma" href="/produtores">Ver todos</Link>}
        >
          {produtores.map((p) => (
            <Link className="cartao carrossel-item carrossel-item-largo" href={`/produtor/${p.handle}`} key={p.handle} style={{ textDecoration: 'none' }}>
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
        </Carrossel>
      </section>
    </>
  );
}
