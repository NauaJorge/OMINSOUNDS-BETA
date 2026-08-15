'use client';

import { usarPlayer } from './Player';

export default function BotaoTocar({ faixa, largo = false }) {
  const { atual, tocando, tocar } = usarPlayer();
  const eAtual = atual?.id === faixa.id;
  const noAr = eAtual && tocando;

  return (
    <button
      type="button"
      className={`tocar ${largo ? 'tocar-largo' : ''} ${eAtual ? 'tocar-ativo' : ''}`}
      onClick={() => tocar(faixa)}
      aria-label={`${noAr ? 'Pausar' : 'Tocar'} ${faixa.titulo}`}
    >
      {noAr ? (
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
      )}
      {largo && <span>{noAr ? 'Tocando' : 'Tocar'}</span>}
    </button>
  );
}
