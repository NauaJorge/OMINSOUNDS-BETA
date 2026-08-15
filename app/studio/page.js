import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql } from '../../lib/db';
import { usuarioAtual } from '../../lib/sessao';
import { contarPendentes } from '../../lib/mensagens';
import BotaoTocar from '../player/BotaoTocar';

export const metadata = { title: 'Studio | OMINSOUNDS' };

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function Studio() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');

  // Cada consulta e presa ao id da sessao. Um produtor nunca alcanca o
  // catalogo de outro trocando parametro nenhum, porque nao ha parametro.
  const beats = await sql`
    SELECT id, titulo, capa_url, audio_url, bpm, tom, genero, mood, preco_centavos, plays, favoritos, publicado
    FROM beats WHERE produtor_id = ${usuario.id}
    ORDER BY criado_em DESC
  `;
  const pendentes = await contarPendentes(usuario.id);

  const totalPlays = beats.reduce((s, b) => s + b.plays, 0);
  const totalFavoritos = beats.reduce((s, b) => s + b.favoritos, 0);

  return (
    <div className="container secao">
      <div className="secao-titulo" style={{ alignItems: 'center', marginBottom: 30 }}>
        <div>
          <span className="olho">Studio de {usuario.nome}</span>
          <h1 style={{ marginBottom: 6 }}>Seu painel.</h1>
          <p className="leve" style={{ margin: 0 }}>
            @{usuario.handle}{usuario.cidade ? ` · ${usuario.cidade}` : ''}
          </p>
        </div>
        <Link className="btn btn-linha" href={`/produtor/${usuario.handle}`}>
          Ver meu perfil público
        </Link>
      </div>

      <div className="grade grade-4">
        <div className="cartao"><div className="cartao-corpo">
          <span className="mini">Beats publicados</span>
          <div className="numeros"><div><strong>{beats.length}</strong><span>no catálogo</span></div></div>
        </div></div>
        <div className="cartao"><div className="cartao-corpo">
          <span className="mini">Plays</span>
          <div className="numeros"><div><strong>{totalPlays.toLocaleString('pt-BR')}</strong><span>total</span></div></div>
        </div></div>
        <div className="cartao"><div className="cartao-corpo">
          <span className="mini">Favoritos</span>
          <div className="numeros"><div><strong>{totalFavoritos.toLocaleString('pt-BR')}</strong><span>total</span></div></div>
        </div></div>
        <div className="cartao"><div className="cartao-corpo">
          <span className="mini">Pedidos de contato</span>
          <div className="numeros"><div><strong>{pendentes}</strong><span>esperando você</span></div></div>
          {pendentes > 0 && (
            <Link className="btn btn-ouro" href="/mensagens" style={{ marginTop: 12 }}>
              Ver pedidos
            </Link>
          )}
        </div></div>
      </div>

      <section className="secao" style={{ paddingBottom: 0 }}>
        <div className="secao-titulo" style={{ alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Meu catálogo</h2>
          <span className="mini">Só você vê esta lista</span>
        </div>

        {beats.length === 0 ? (
          <p className="vazio">Você ainda não publicou nenhum beat.</p>
        ) : (
          <ol className="lista-beats">
            {beats.map((b, i) => (
              <li className="linha-beat" key={b.id}>
                <span className="linha-num mini">{String(i + 1).padStart(2, '0')}</span>

                <div className="linha-capa">
                  <img src={b.capa_url} alt="" width="56" height="56" loading="lazy" />
                  <BotaoTocar
                    faixa={{
                      id: b.id, titulo: b.titulo, produtor: usuario.nome,
                      handle: usuario.handle, capa: b.capa_url, audio: b.audio_url,
                    }}
                  />
                </div>

                <div className="linha-titulo">
                  <strong>{b.titulo}</strong>
                  <span className="mini">
                    {b.genero} · {b.mood}
                    {!b.publicado && ' · rascunho'}
                  </span>
                </div>

                <span className="linha-tec mini">{b.bpm} BPM · {b.tom}</span>
                <span className="linha-plays mini">
                  {b.plays.toLocaleString('pt-BR')} plays · {b.favoritos} favoritos
                </span>
                <span className="preco linha-preco">{real(b.preco_centavos)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="cofre" style={{ marginTop: 30 }}>
        Publicar e editar beat pelo painel ainda não entrou: nesta fase o catálogo
        vem do banco de teste. O que está de pé é o que precisa ser validado agora —
        login por conta, catálogo separado por produtor e mensagem com aceite.
      </p>
    </div>
  );
}
