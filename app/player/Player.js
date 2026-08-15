'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const ContextoPlayer = createContext(null);

export function usarPlayer() {
  const ctx = useContext(ContextoPlayer);
  if (!ctx) throw new Error('usarPlayer precisa estar dentro do Player.');
  return ctx;
}

function tempo(segundos) {
  if (!Number.isFinite(segundos)) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/*
  O <audio> vive aqui, no layout raiz, e nunca desmonta. Trocar de pagina no
  App Router troca so o {children}: o elemento de audio continua o mesmo nodo
  do DOM, entao a musica nao para e o arquivo nao e baixado de novo.

  Foi por isso que virou contexto em vez de um <audio controls> por cartao:
  cada cartao com o proprio elemento fazia o beat parar na navegacao e um
  arquivo de 6 MB ser baixado outra vez a cada clique.
*/
export default function Player({ children }) {
  const audioRef = useRef(null);
  const [atual, setAtual] = useState(null);
  const [tocando, setTocando] = useState(false);
  const [posicao, setPosicao] = useState(0);
  const [duracao, setDuracao] = useState(0);

  function tocar(faixa) {
    const audio = audioRef.current;
    if (!audio) return;

    // Mesmo beat: alterna em vez de recomecar.
    if (atual?.id === faixa.id) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }

    setAtual(faixa);
    audio.src = faixa.audio;
    audio.play().catch(() => {});
  }

  function alternar() {
    const audio = audioRef.current;
    if (!audio || !atual) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function buscar(evento) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duracao)) return;
    audio.currentTime = Number(evento.target.value);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const aoTocar = () => setTocando(true);
    const aoPausar = () => setTocando(false);
    const aoAndar = () => setPosicao(audio.currentTime);
    const aoCarregar = () => setDuracao(audio.duration);
    const aoTerminar = () => { setTocando(false); setPosicao(0); };

    audio.addEventListener('play', aoTocar);
    audio.addEventListener('pause', aoPausar);
    audio.addEventListener('timeupdate', aoAndar);
    audio.addEventListener('loadedmetadata', aoCarregar);
    audio.addEventListener('ended', aoTerminar);
    return () => {
      audio.removeEventListener('play', aoTocar);
      audio.removeEventListener('pause', aoPausar);
      audio.removeEventListener('timeupdate', aoAndar);
      audio.removeEventListener('loadedmetadata', aoCarregar);
      audio.removeEventListener('ended', aoTerminar);
    };
  }, []);

  // Barra de espaco toca e pausa, desde que o foco nao esteja num campo.
  useEffect(() => {
    function aoTeclar(e) {
      if (e.code !== 'Space' || !atual) return;
      const alvo = e.target;
      if (alvo.closest('input, textarea, button, a, [contenteditable]')) return;
      e.preventDefault();
      alternar();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [atual]);

  return (
    <ContextoPlayer.Provider value={{ atual, tocando, tocar, alternar }}>
      {children}

      <audio ref={audioRef} preload="none" />

      {atual && (
        <div className="player" role="region" aria-label="Player">
          <img className="player-capa" src={atual.capa} alt="" width="52" height="52" />

          <div className="player-info">
            <strong>{atual.titulo}</strong>
            <Link className="mini" href={`/produtor/${atual.handle}`}>{atual.produtor}</Link>
          </div>

          <button
            className="player-botao"
            type="button"
            onClick={alternar}
            aria-label={tocando ? 'Pausar' : 'Tocar'}
          >
            {tocando ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <div className="player-barra">
            <span className="mini">{tempo(posicao)}</span>
            <input
              type="range"
              min="0"
              max={Number.isFinite(duracao) && duracao > 0 ? duracao : 0}
              value={posicao}
              onChange={buscar}
              aria-label="Posição da faixa"
            />
            <span className="mini">{tempo(duracao)}</span>
          </div>
        </div>
      )}
    </ContextoPlayer.Provider>
  );
}
