import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql } from '../../lib/db';
import { usuarioAtual } from '../../lib/sessao';
import { contarPendentes } from '../../lib/mensagens';
import LinhaBeat from '../player/LinhaBeat';
import { codigoCamelot } from '../../lib/harmonia';

export const metadata = { title: 'Studio | OMINSOUNDS' };

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function Studio() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  // Studio e do produtor. Artista logado seria mandado para um painel que
  // nao e dele, com catalogo sempre vazio.
  if (usuario.papel === 'artista') redirect('/beats');

  // Cada consulta e presa ao id da sessao. Um produtor nunca alcanca o
  // catalogo de outro trocando parametro nenhum, porque nao ha parametro.
  const beats = await sql`
    SELECT id, titulo, capa_url, audio_url, picos, bpm, tom, genero, mood, preco_centavos, plays, favoritos, publicado
    FROM beats WHERE produtor_id = ${usuario.id}
    ORDER BY criado_em DESC
  `;
  const pendentes = await contarPendentes(usuario.id);

  const meus = new Set(
    (await sql`SELECT beat_id FROM favoritos WHERE usuario_id = ${usuario.id}`).map((f) => f.beat_id)
  );

  const comPicos = beats.map((b) => ({
    ...b,
    picos: JSON.parse(b.picos || '[]'),
    camelot: codigoCamelot(b.tom),
    favoritado: meus.has(b.id),
    produtor: usuario.nome,
    handle: usuario.handle,
  }));
  const lista = comPicos.map((b) => ({
    id: b.id, titulo: b.titulo, produtor: usuario.nome, handle: usuario.handle,
    capa: b.capa_url, audio: b.audio_url, picos: b.picos,
    bpm: b.bpm, tom: b.tom,
  }));

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
            {comPicos.map((b, i) => (
              <LinhaBeat key={b.id} beat={b} indice={i} lista={lista} logado />
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
