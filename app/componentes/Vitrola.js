import Link from 'next/link';

/*
  Duas colunas de capas girando em sentidos opostos, cinza no repouso e
  coloridas ao passar o mouse. E a mesma ideia da faixa de playlists da
  BeatPlace, resolvida so com CSS.

  Sem JavaScript de proposito: e decoracao que roda o tempo todo na primeira
  dobra. Animar com script custa quadro a quadro; aqui so `transform` muda,
  e a GPU resolve sozinha.

  A lista e repetida duas vezes na marcacao. A animacao anda exatamente
  metade da altura, entao no instante em que reinicia a segunda copia esta
  no lugar da primeira e a emenda nao aparece. A copia repetida fica com
  aria-hidden, senao o leitor de tela anuncia tudo duas vezes.
*/

// A referencia de artista entra na convencao "type beat", que descreve a
// sonoridade e e como o artista procura. O link leva para a busca por essa
// referencia, entao o rotulo nao e enfeite: e o filtro.
const RITMOS = [
  { nome: 'Trap',        artista: 'Matuê',     arquivo: 'trap' },
  { nome: 'Drill',       artista: 'Teto',      arquivo: 'drill' },
  { nome: 'Funk RJ',     artista: 'Cabelinho', arquivo: 'funk-rj' },
  { nome: 'Afrobeat',    artista: 'Burna Boy', arquivo: 'afrobeat' },
  { nome: 'Boom Bap',    artista: 'Emicida',   arquivo: 'boom-bap' },
  { nome: 'Reggaeton',   artista: 'Bad Bunny', arquivo: 'reggaeton' },
  { nome: 'Melódico',    artista: 'Veigh',     arquivo: 'melodico' },
  { nome: 'Drum & Bass', artista: 'Sub Focus', arquivo: 'drum-and-bass' },
];

function Capa({ ritmo, clone }) {
  const conteudo = (
    <>
      <img
        src={`/assents/img/ritmos/${ritmo.arquivo}.jpg`}
        alt=""
        width="640"
        height="640"
        loading="lazy"
        decoding="async"
      />
      <span className="vitrola-nome">
        {ritmo.nome}
        <small>{ritmo.artista} type beat</small>
      </span>
    </>
  );

  if (clone) {
    return <div className="vitrola-capa" aria-hidden="true">{conteudo}</div>;
  }
  return (
    <Link
      className="vitrola-capa"
      href={`/beats?q=${encodeURIComponent(`${ritmo.artista} type beat`)}`}
      aria-label={`Ver beats no estilo ${ritmo.artista} type beat`}
    >
      {conteudo}
    </Link>
  );
}

function Coluna({ ritmos, sentido }) {
  return (
    <div className={`vitrola-coluna vitrola-${sentido}`}>
      <div className="vitrola-trilha">
        {ritmos.map((r) => <Capa key={r.arquivo} ritmo={r} />)}
        {ritmos.map((r) => <Capa key={`${r.arquivo}-clone`} ritmo={r} clone />)}
      </div>
    </div>
  );
}

export default function Vitrola() {
  const meio = Math.ceil(RITMOS.length / 2);
  return (
    <div className="vitrola" role="presentation">
      <Coluna ritmos={RITMOS.slice(0, meio)} sentido="sobe" />
      <Coluna ritmos={RITMOS.slice(meio)} sentido="desce" />
      <div className="vitrola-borda" aria-hidden="true" />
    </div>
  );
}
