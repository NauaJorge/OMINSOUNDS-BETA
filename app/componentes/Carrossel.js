'use client';

import { useEffect, useRef, useState } from 'react';

/*
  Carrossel sem biblioteca. O antigo site carregava o swiper inteiro para
  fazer isto, e o navegador ja resolve com scroll-snap: o arrasto no celular
  e o do proprio sistema, com a inercia certa, e o teclado funciona porque
  continua sendo uma regiao rolavel de verdade.

  Nao gira sozinho. Carrossel automatico tira o controle de quem esta lendo
  e some com o item bem na hora do clique.
*/
export default function Carrossel({ titulo, acao, children, rotulo }) {
  const trilhoRef = useRef(null);
  const [temAntes, setTemAntes] = useState(false);
  const [temDepois, setTemDepois] = useState(false);

  function medir() {
    const t = trilhoRef.current;
    if (!t) return;
    setTemAntes(t.scrollLeft > 8);
    setTemDepois(t.scrollLeft + t.clientWidth < t.scrollWidth - 8);
  }

  useEffect(() => {
    medir();
    const t = trilhoRef.current;
    if (!t) return;
    t.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      t.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, []);

  function deslizar(direcao) {
    const t = trilhoRef.current;
    if (!t) return;
    // Rola quase uma tela cheia, deixando um item de referencia visivel para
    // a pessoa nao perder o fio de onde estava.
    t.scrollBy({ left: direcao * (t.clientWidth * 0.85), behavior: 'smooth' });
  }

  return (
    <section className="carrossel">
      <div className="secao-titulo carrossel-topo">
        <h2>{titulo}</h2>
        <div className="carrossel-acoes">
          {acao}
          <div className="carrossel-setas">
            <button
              type="button" className="seta" onClick={() => deslizar(-1)}
              disabled={!temAntes} aria-label="Ver anteriores"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button
              type="button" className="seta" onClick={() => deslizar(1)}
              disabled={!temDepois} aria-label="Ver próximos"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className="carrossel-trilho"
        ref={trilhoRef}
        tabIndex={0}
        role="group"
        aria-label={rotulo ?? titulo}
      >
        {children}
      </div>
    </section>
  );
}
