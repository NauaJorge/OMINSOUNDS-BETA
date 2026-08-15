import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql } from '../../lib/db';
import { usuarioAtual } from '../../lib/sessao';
import { contarPendentes } from '../../lib/mensagens';

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
    SELECT id, titulo, capa_url, bpm, tom, genero, mood, preco_centavos, plays, favoritos, publicado
    FROM beats WHERE produtor_id = ${usuario.id}
    ORDER BY criado_em DESC
  `;
  const pendentes = await contarPendentes(usuario.id);

  const totalPlays = beats.reduce((s, b) => s + b.plays, 0);
  const totalFavoritos = beats.reduce((s, b) => s + b.favoritos, 0);

  return (
    <div className="container secao">
      <div className="secao-titulo">
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
        <div className="secao-titulo">
          <h2>Meu catálogo</h2>
          <span className="mini">Só você vê esta lista</span>
        </div>

        {beats.length === 0 ? (
          <p className="vazio">Você ainda não publicou nenhum beat.</p>
        ) : (
          <div className="grade grade-3">
            {beats.map((b) => (
              <article className="cartao" key={b.id}>
                <img className="beat-capa" src={b.capa_url} alt="" width="600" height="600" loading="lazy" />
                <div className="cartao-corpo">
                  <h3>{b.titulo}</h3>
                  <p className="mini" style={{ margin: 0 }}>
                    {b.bpm} BPM · {b.tom}
                  </p>
                  <div className="beat-meta">
                    <span className="etiqueta">{b.genero}</span>
                    <span className="etiqueta">{b.mood}</span>
                    {!b.publicado && <span className="etiqueta">rascunho</span>}
                  </div>
                  <div className="numeros">
                    <div><strong className="preco" style={{ fontSize: 18 }}>{real(b.preco_centavos)}</strong><span>licença</span></div>
                    <div><strong style={{ fontSize: 18 }}>{b.plays.toLocaleString('pt-BR')}</strong><span>plays</span></div>
                    <div><strong style={{ fontSize: 18 }}>{b.favoritos}</strong><span>favoritos</span></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
