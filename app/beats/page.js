import Link from 'next/link';
import { sql } from '../../lib/db';
import LinhaBeat from '../player/LinhaBeat';
import Filtros from './Filtros';
import { codigoCamelot, tonsCompativeis } from '../../lib/harmonia';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Beats | OMINSOUNDS' };

const ORDENS = {
  tocados: 'mais tocados',
  novos: 'mais novos',
  barato: 'menor preço',
  caro: 'maior preço',
};

export default async function Beats({ searchParams }) {
  const p = await searchParams;
  const busca = (p.q ?? '').trim();
  const genero = p.genero ?? '';
  const mood = p.mood ?? '';
  const tom = p.tom ?? '';
  const combinaCom = p.combina ?? '';

  // Filtro harmonico: em vez de um tom exato, todos os que convivem com ele.
  // Vem como lista e entra no SQL com = ANY, continuando parametrizado.
  const tonsOk = combinaCom ? tonsCompativeis(combinaCom) : [];
  const bpmMin = Number(p.bpmMin) || 0;
  const bpmMax = Number(p.bpmMax) || 999;
  const ordem = ORDENS[p.ordem] ? p.ordem : 'tocados';

  // Um SELECT so, com cada filtro neutralizado quando vem vazio. Montar SQL
  // concatenando pedaco de texto seria o caminho curto e o jeito de abrir
  // injecao; aqui tudo continua parametrizado.
  const linhas = await sql`
    SELECT b.id, b.titulo, b.capa_url, b.audio_url, b.picos, b.bpm, b.tom,
           b.genero, b.mood, b.preco_centavos, b.plays,
           u.handle, u.nome AS produtor
    FROM beats b
    JOIN usuarios u ON u.id = b.produtor_id
    WHERE b.publicado
      AND (${busca} = '' OR b.titulo ILIKE ${'%' + busca + '%'} OR u.nome ILIKE ${'%' + busca + '%'})
      AND (${genero} = '' OR b.genero = ${genero})
      AND (${mood} = '' OR b.mood = ${mood})
      AND (${tom} = '' OR b.tom = ${tom})
      AND (${combinaCom} = '' OR b.tom = ANY(${tonsOk}))
      AND b.bpm BETWEEN ${bpmMin} AND ${bpmMax}
    ORDER BY
      CASE WHEN ${ordem} = 'tocados' THEN b.plays END DESC,
      CASE WHEN ${ordem} = 'novos'   THEN b.criado_em END DESC,
      CASE WHEN ${ordem} = 'barato'  THEN b.preco_centavos END ASC,
      CASE WHEN ${ordem} = 'caro'    THEN b.preco_centavos END DESC,
      b.id
  `;

  const beats = linhas.map((b) => ({
    ...b,
    picos: JSON.parse(b.picos || '[]'),
    camelot: codigoCamelot(b.tom),
  }));

  const opcoes = await sql`
    SELECT
      array_agg(DISTINCT genero) FILTER (WHERE genero <> '') AS generos,
      array_agg(DISTINCT mood)   FILTER (WHERE mood   <> '') AS moods,
      array_agg(DISTINCT tom)    FILTER (WHERE tom    <> '') AS tons,
      min(bpm) AS bpm_min, max(bpm) AS bpm_max
    FROM beats WHERE publicado
  `;

  const lista = beats.map((b) => ({
    id: b.id, titulo: b.titulo, produtor: b.produtor, handle: b.handle,
    capa: b.capa_url, audio: b.audio_url, picos: b.picos,
    bpm: b.bpm, tom: b.tom,
  }));

  const filtrando = busca || genero || mood || tom || combinaCom || p.bpmMin || p.bpmMax;

  return (
    <div className="container secao">
      <span className="olho">Catálogo</span>
      <h1>Beats</h1>

      <Filtros
        valores={{ q: busca, genero, mood, tom, combina: combinaCom, bpmMin: p.bpmMin ?? '', bpmMax: p.bpmMax ?? '', ordem }}
        opcoes={{
          generos: opcoes[0]?.generos ?? [],
          moods: opcoes[0]?.moods ?? [],
          tons: opcoes[0]?.tons ?? [],
          bpmMin: opcoes[0]?.bpm_min ?? 60,
          bpmMax: opcoes[0]?.bpm_max ?? 200,
        }}
        ordens={ORDENS}
      />

      {combinaCom && (
        <p className="aviso aviso-ok" style={{ marginTop: 18 }}>
          Mostrando o que combina com <strong>{combinaCom}</strong>: mesmo tom, o
          relativo e os vizinhos na roda de Camelot — {tonsOk.join(', ')}.
        </p>
      )}

      <p className="mini" style={{ margin: '18px 0 10px' }}>
        {beats.length} {beats.length === 1 ? 'beat' : 'beats'}
        {filtrando && <> · <Link className="text-link" href="/beats">limpar filtros</Link></>}
      </p>

      {beats.length === 0 ? (
        <p className="vazio">
          Nenhum beat com esses filtros. <Link className="text-link" href="/beats">Ver tudo</Link>
        </p>
      ) : (
        <ol className="lista-beats">
          {beats.map((b, i) => (
            <LinhaBeat key={b.id} beat={b} indice={i} lista={lista} mostrarProdutor />
          ))}
        </ol>
      )}
    </div>
  );
}
