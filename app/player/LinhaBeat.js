'use client';

import Link from 'next/link';
import { usarPlayer } from './Player';
import BotaoTocar from './BotaoTocar';
import BotaoFavorito from './BotaoFavorito';
import Onda from './Onda';

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Linha de catalogo. A onda fica na propria linha, como no BeatPlace: o
 * formato da faixa vira informacao de escolha, junto com BPM e tom.
 */
export default function LinhaBeat({ beat, indice, lista, mostrarProdutor = false, logado = false }) {
  const { atual, tocando, progresso } = usarPlayer();
  const eAtual = atual?.id === beat.id;

  const faixa = {
    id: beat.id, titulo: beat.titulo, produtor: beat.produtor,
    handle: beat.handle, capa: beat.capa_url, audio: beat.audio_url,
    picos: beat.picos, bpm: beat.bpm, tom: beat.tom,
  };

  return (
    <li className={`linha-beat ${eAtual ? 'linha-ativa' : ''}`}>
      <span className="linha-num mini">
        {eAtual && tocando ? (
          <span className="equalizador" aria-label="Tocando agora"><i /><i /><i /></span>
        ) : (
          String(indice + 1).padStart(2, '0')
        )}
      </span>

      <div className="linha-capa">
        <img src={beat.capa_url} alt="" width="56" height="56" loading="lazy" />
        <BotaoTocar faixa={faixa} lista={lista} />
      </div>

      <div className="linha-titulo">
        {/* O titulo leva para a pagina do beat. Antes nao levava a lugar
            nenhum, e nao existia link para mandar um beat especifico. */}
        <Link className="linha-link" href={`/beat/${beat.id}`}>{beat.titulo}</Link>
        <span className="mini">
          {mostrarProdutor ? (
            <Link href={`/produtor/${beat.handle}`}>{beat.produtor}</Link>
          ) : (
            <>{beat.genero} · {beat.mood}</>
          )}
        </span>
      </div>

      <div className="linha-onda">
        <Onda picos={beat.picos} progresso={eAtual ? progresso : 0} altura={30} />
      </div>

      <span className="linha-tec mini">
        {beat.bpm} BPM · {beat.tom}
        {beat.camelot && <span className="camelot" title={`Camelot ${beat.camelot}`}>{beat.camelot}</span>}
      </span>
      <BotaoFavorito
        beatId={beat.id}
        favoritado={beat.favoritado}
        total={beat.favoritos}
        logado={logado}
      />

      <span className="preco linha-preco">
        {beat.gratis ? <span className="selo-gratis">grátis</span> : real(beat.preco_centavos)}
      </span>
    </li>
  );
}
