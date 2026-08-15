import Link from 'next/link';
import { sql } from '../../lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Beats | OMINSOUNDS' };

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function Beats({ searchParams }) {
  const { genero = '' } = await searchParams;

  const beats = genero
    ? await sql`
        SELECT b.*, u.handle, u.nome AS produtor FROM beats b
        JOIN usuarios u ON u.id = b.produtor_id
        WHERE b.publicado AND b.genero = ${genero}
        ORDER BY b.plays DESC`
    : await sql`
        SELECT b.*, u.handle, u.nome AS produtor FROM beats b
        JOIN usuarios u ON u.id = b.produtor_id
        WHERE b.publicado ORDER BY b.plays DESC`;

  const generos = await sql`
    SELECT DISTINCT genero FROM beats WHERE publicado AND genero <> '' ORDER BY genero
  `;

  return (
    <div className="container secao">
      <span className="olho">Catálogo</span>
      <h1>Beats</h1>

      <div className="beat-meta" style={{ marginBottom: 26 }}>
        <Link className="etiqueta" href="/beats"
              style={!genero ? { borderColor: 'var(--ouro)', color: 'var(--ouro)' } : undefined}>
          Todos
        </Link>
        {generos.map((g) => (
          <Link className="etiqueta" key={g.genero} href={`/beats?genero=${encodeURIComponent(g.genero)}`}
                style={genero === g.genero ? { borderColor: 'var(--ouro)', color: 'var(--ouro)' } : undefined}>
            {g.genero}
          </Link>
        ))}
      </div>

      {beats.length === 0 ? (
        <p className="vazio">Nenhum beat neste filtro.</p>
      ) : (
        <div className="grade grade-4">
          {beats.map((b) => (
            <article className="cartao" key={b.id}>
              <img className="beat-capa" src={b.capa_url} alt="" width="600" height="600" loading="lazy" />
              <div className="cartao-corpo">
                <h3 style={{ marginBottom: 2 }}>{b.titulo}</h3>
                <Link className="mini" href={`/produtor/${b.handle}`}>{b.produtor}</Link>
                <div className="beat-meta">
                  <span className="etiqueta">{b.bpm} BPM</span>
                  <span className="etiqueta">{b.tom}</span>
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
    </div>
  );
}
