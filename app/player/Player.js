'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Onda from './Onda';

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
  App Router troca so o {children}: o elemento continua o mesmo nodo do DOM,
  entao a musica nao para e o arquivo nao e baixado de novo.

  O player guarda uma fila. Clicar num beat de uma lista nao toca so aquele:
  toca a lista a partir dali, e ao terminar segue para o proximo. E o que se
  espera de catalogo de beat — a pessoa deixa rolando enquanto navega.
*/
export default function Player({ children }) {
  const audioRef = useRef(null);
  const [fila, setFila] = useState([]);
  const [indice, setIndice] = useState(-1);
  const [tocando, setTocando] = useState(false);
  const [posicao, setPosicao] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [ritmo, setRitmo] = useState(1);
  const [mudarTom, setMudarTom] = useState(false);

  const atual = indice >= 0 ? fila[indice] : null;

  function carregar(faixa) {
    const audio = audioRef.current;
    if (!audio || !faixa) return;
    audio.src = faixa.audio;
    audio.play().catch(() => {});
  }

  /** Toca a faixa. Se vier lista junto, ela vira a fila corrente. */
  function tocar(faixa, lista) {
    const audio = audioRef.current;
    if (!audio) return;

    if (atual?.id === faixa.id) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }

    const nova = Array.isArray(lista) && lista.length ? lista : [faixa];
    const pos = Math.max(nova.findIndex((f) => f.id === faixa.id), 0);
    setFila(nova);
    setIndice(pos);
    carregar(nova[pos]);
  }

  function alternar() {
    const audio = audioRef.current;
    if (!audio || !atual) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function irPara(passo) {
    if (fila.length < 2) return;
    const novo = (indice + passo + fila.length) % fila.length;
    setIndice(novo);
    carregar(fila[novo]);
  }

  function buscarFracao(fracao) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = audio.duration * fracao;
  }

  /*
    Ajuste de andamento. Serve para o artista descobrir, antes de comprar, se
    o beat cabe no tempo da musica dele.

    preservesPitch ligado: muda so a velocidade, o tom fica onde estava. E o
    que um DAW moderno faz.
    preservesPitch desligado: sobe e desce o tom junto, que e o que acontece
    ao acelerar um disco. Produtor usa os dois, entao os dois estao aqui.
  */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = ritmo;
    audio.preservesPitch = !mudarTom;
    audio.mozPreservesPitch = !mudarTom;
    audio.webkitPreservesPitch = !mudarTom;
  }, [ritmo, mudarTom, atual]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const aoTocar = () => setTocando(true);
    const aoPausar = () => setTocando(false);
    const aoAndar = () => setPosicao(audio.currentTime);
    const aoCarregar = () => setDuracao(audio.duration);
    audio.addEventListener('play', aoTocar);
    audio.addEventListener('pause', aoPausar);
    audio.addEventListener('timeupdate', aoAndar);
    audio.addEventListener('loadedmetadata', aoCarregar);
    return () => {
      audio.removeEventListener('play', aoTocar);
      audio.removeEventListener('pause', aoPausar);
      audio.removeEventListener('timeupdate', aoAndar);
      audio.removeEventListener('loadedmetadata', aoCarregar);
    };
  }, []);

  // O fim da faixa depende da fila, entao este ouvinte e trocado quando ela
  // muda. Deixar junto do de cima faria ele fechar sobre uma fila velha.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const aoTerminar = () => {
      if (indice >= 0 && indice < fila.length - 1) irPara(1);
      else { setTocando(false); setPosicao(0); }
    };
    audio.addEventListener('ended', aoTerminar);
    return () => audio.removeEventListener('ended', aoTerminar);
  }, [fila, indice]);

  useEffect(() => {
    function aoTeclar(e) {
      if (!atual) return;
      if (e.target.closest('input, textarea, button, a, [contenteditable]')) return;
      if (e.code === 'Space') { e.preventDefault(); alternar(); }
      if (e.code === 'ArrowRight' && e.shiftKey) { e.preventDefault(); irPara(1); }
      if (e.code === 'ArrowLeft' && e.shiftKey) { e.preventDefault(); irPara(-1); }
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [atual, fila, indice]);

  const progresso = duracao > 0 ? posicao / duracao : 0;

  return (
    <ContextoPlayer.Provider value={{ atual, tocando, tocar, alternar, progresso }}>
      {children}

      <audio ref={audioRef} preload="none" />

      {atual && (
        <div className="player" role="region" aria-label="Player">
          <img className="player-capa" src={atual.capa} alt="" width="52" height="52" />

          <div className="player-info">
            <strong>{atual.titulo}</strong>
            <Link className="mini" href={`/produtor/${atual.handle}`}>{atual.produtor}</Link>
          </div>

          <div className="player-controles">
            <button
              className="player-passo" type="button" onClick={() => irPara(-1)}
              disabled={fila.length < 2} aria-label="Faixa anterior"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h2v14H7zm3 7 9-7v14z"/></svg>
            </button>

            <button className="player-botao" type="button" onClick={alternar}
                    aria-label={tocando ? 'Pausar' : 'Tocar'}>
              {tocando ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button
              className="player-passo" type="button" onClick={() => irPara(1)}
              disabled={fila.length < 2} aria-label="Próxima faixa"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5h2v14h-2zM5 5l9 7-9 7z"/></svg>
            </button>
          </div>

          <div className="player-onda">
            <span className="mini">{tempo(posicao)}</span>
            <Onda picos={atual.picos} progresso={progresso} aoBuscar={buscarFracao} altura={34} />
            <span className="mini">{tempo(duracao)}</span>
          </div>

          <div className="player-tempo">
            <label className="mini" htmlFor="ritmo">
              {atual.bpm
                ? <><strong>{Math.round(atual.bpm * ritmo)}</strong> BPM</>
                : <>{ritmo.toFixed(2)}×</>}
            </label>
            <input
              id="ritmo" type="range" min="0.75" max="1.25" step="0.01"
              value={ritmo} onChange={(e) => setRitmo(Number(e.target.value))}
              aria-label="Andamento da faixa"
              title="Ouça o beat no tempo da sua música"
            />
            <button
              type="button"
              className={`chip-tom ${mudarTom ? 'chip-tom-ativo' : ''}`}
              onClick={() => setMudarTom((v) => !v)}
              aria-pressed={mudarTom}
              title={mudarTom
                ? 'O tom sobe e desce junto, como acelerar um disco'
                : 'O tom fica onde está, só a velocidade muda'}
            >
              {mudarTom ? 'tom junto' : 'tom fixo'}
            </button>
            {ritmo !== 1 && (
              <button type="button" className="chip-tom" onClick={() => setRitmo(1)}>
                voltar
              </button>
            )}
          </div>

          {fila.length > 1 && (
            <span className="mini player-fila">{indice + 1}/{fila.length}</span>
          )}
        </div>
      )}
    </ContextoPlayer.Provider>
  );
}
