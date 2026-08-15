import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '../../../lib/db';
import { usuarioAtual } from '../../../lib/sessao';
import { codigoCamelot, tonsCompativeis } from '../../../lib/harmonia';
import LinhaBeat from '../../player/LinhaBeat';
import CabecalhoBeat from './CabecalhoBeat';

export const dynamic = 'force-dynamic';

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const r = await sql`
    SELECT b.titulo, b.bpm, b.tom, b.genero, u.nome
    FROM beats b JOIN usuarios u ON u.id = b.produtor_id WHERE b.id = ${Number(id) || 0}
  `;
  if (!r[0]) return { title: 'Beat | OMINSOUNDS' };
  return {
    title: `${r[0].titulo} — ${r[0].nome} | OMINSOUNDS`,
    description: `${r[0].genero}, ${r[0].bpm} BPM, ${r[0].tom}. Beat de ${r[0].nome} na OMINSOUNDS.`,
  };
}

export default async function Beat({ params }) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const r = await sql`
    SELECT b.*, u.handle, u.nome AS produtor, u.avatar_url, u.cidade
    FROM beats b JOIN usuarios u ON u.id = b.produtor_id
    WHERE b.id = ${numero} AND b.publicado
  `;
  const beat = r[0];
  if (!beat) notFound();

  const licencas = await sql`
    SELECT nome, preco_centavos, formatos, uso, exclusiva
    FROM licencas WHERE beat_id = ${numero} ORDER BY ordem
  `;

  const visitante = await usuarioAtual();
  const favoritado = visitante
    ? (await sql`SELECT 1 FROM favoritos WHERE usuario_id = ${visitante.id} AND beat_id = ${numero}`).length > 0
    : false;

  // "Combina com este" usa a roda de Camelot, nao o genero: o que decide se
  // dois beats convivem e o tom, e nao a etiqueta comercial.
  const compativeis = tonsCompativeis(beat.tom);
  const parecidos = compativeis.length
    ? await sql`
        SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.picos, b.bpm, b.tom,
               b.genero, b.mood, b.preco_centavos, b.favoritos, b.tags, b.gratis,
               u.handle, u.nome AS produtor
        FROM beats b JOIN usuarios u ON u.id = b.produtor_id
        WHERE b.publicado AND b.id <> ${numero} AND b.tom = ANY(${compativeis})
        ORDER BY b.plays DESC LIMIT 4
      `
    : [];

  const listaParecidos = parecidos.map((b) => ({
    ...b,
    picos: JSON.parse(b.picos || '[]'),
    camelot: codigoCamelot(b.tom),
  }));
  const fila = listaParecidos.map((b) => ({
    id: b.id, titulo: b.titulo, produtor: b.produtor, handle: b.handle,
    capa: b.capa_url, audio: b.audio_url, picos: b.picos, bpm: b.bpm, tom: b.tom,
  }));

  const faixa = {
    id: beat.id, titulo: beat.titulo, produtor: beat.produtor, handle: beat.handle,
    capa: beat.capa_url, audio: beat.audio_url,
    picos: JSON.parse(beat.picos || '[]'), bpm: beat.bpm, tom: beat.tom,
  };

  return (
    <div className="container secao">
      <CabecalhoBeat
        faixa={faixa}
        beat={beat}
        camelot={codigoCamelot(beat.tom)}
        favoritado={favoritado}
        logado={!!visitante}
      />

      <div className="perfil-grade" style={{ marginTop: 34 }}>
        <div>
          {beat.tags?.length > 0 && (
            <div className="beat-meta" style={{ marginBottom: 22 }}>
              {beat.tags.map((t) => (
                <Link className="etiqueta" key={t} href={`/beats?tag=${encodeURIComponent(t)}`}>{t}</Link>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 22 }}>{beat.gratis ? 'Como usar este beat' : 'Licenças'}</h2>
          <p className="leve" style={{ fontSize: 15, maxWidth: '58ch' }}>
            {beat.gratis
              ? 'Este beat foi liberado pelo produtor. Leia o que pode e o que não pode antes de lançar.'
              : 'O que muda de uma para outra é o arquivo que você recebe e o quanto pode usar. Escolha pela entrega, não só pelo preço.'}
          </p>

          <div className="licencas">
            {licencas.map((l) => (
              <article className={`licenca ${l.exclusiva ? 'licenca-exclusiva' : ''}`} key={l.nome}>
                <div className="licenca-topo">
                  <h3>{l.nome}</h3>
                  <strong className="preco">
                    {l.preco_centavos === 0 ? 'Grátis' : real(l.preco_centavos)}
                  </strong>
                </div>
                <p className="licenca-formatos">{l.formatos}</p>
                <p className="mini" style={{ margin: 0 }}>{l.uso}</p>
              </article>
            ))}
          </div>

          <p className="cofre" style={{ marginTop: 18 }}>
            {beat.gratis
              ? 'Ambiente de teste: o download ainda não está ligado. Fale com o produtor pela caixa de mensagens para receber o arquivo.'
              : 'Ambiente de teste: a compra ainda não está ligada. O pagamento fica para depois, por decisão do Diretor. Para fechar agora, fale com o produtor pela caixa de mensagens.'}
          </p>

          {listaParecidos.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: 22, marginBottom: 6 }}>Combina com este</h2>
              <p className="leve" style={{ fontSize: 15, marginTop: 0 }}>
                Beats em tom que convive com <strong>{beat.tom}</strong> na roda de
                Camelot — dá para cantar a mesma melodia por cima, ou juntar os dois.
              </p>
              <ol className="lista-beats">
                {listaParecidos.map((b, i) => (
                  <LinhaBeat
                    key={b.id} beat={b} indice={i} lista={fila}
                    mostrarProdutor logado={!!visitante}
                  />
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="perfil-lado">
          <Link className="cartao" href={`/produtor/${beat.handle}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="cartao-corpo">
              <span className="olho">Produzido por</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 6 }}>
                <img className="avatar" src={beat.avatar_url || '/assents/img/user-circle.svg'} alt="" width="46" height="46" />
                <div>
                  <strong>{beat.produtor}</strong>
                  <div className="mini">@{beat.handle}{beat.cidade ? ` · ${beat.cidade}` : ''}</div>
                </div>
              </div>
            </div>
          </Link>

          <div className="cartao" style={{ marginTop: 14 }}>
            <div className="cartao-corpo">
              <h3>Ficha técnica</h3>
              <dl className="ficha">
                <div><dt>BPM</dt><dd>{beat.bpm}</dd></div>
                <div><dt>Tom</dt><dd>{beat.tom} <span className="camelot">{codigoCamelot(beat.tom)}</span></dd></div>
                <div><dt>Gênero</dt><dd>{beat.genero}</dd></div>
                <div><dt>Mood</dt><dd>{beat.mood}</dd></div>
                <div><dt>Prévia</dt><dd>{beat.duracao_seg || 30}s</dd></div>
                <div><dt>Plays</dt><dd>{beat.plays.toLocaleString('pt-BR')}</dd></div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
