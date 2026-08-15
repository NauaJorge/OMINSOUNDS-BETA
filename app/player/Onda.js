'use client';

/*
  Desenha a forma de onda a partir dos picos que ja vieram calculados do
  servidor. Nao decodifica audio no navegador: com varios beats na tela, o
  caminho comum (wavesurfer decodificando cada faixa) baixaria megabytes so
  para desenhar risquinho. Aqui cada onda custa um array de 140 numeros.
*/
export default function Onda({ picos, progresso = 0, aoBuscar, altura = 40 }) {
  const valores = Array.isArray(picos) ? picos : [];
  if (valores.length === 0) return null;

  const largura = valores.length * 3; // 2px de barra + 1px de respiro
  const corte = Math.round(valores.length * Math.min(Math.max(progresso, 0), 1));

  function aoClicar(e) {
    if (!aoBuscar) return;
    const caixa = e.currentTarget.getBoundingClientRect();
    aoBuscar(Math.min(Math.max((e.clientX - caixa.left) / caixa.width, 0), 1));
  }

  return (
    <svg
      className={`onda ${aoBuscar ? 'onda-clicavel' : ''}`}
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="none"
      height={altura}
      onClick={aoClicar}
      role={aoBuscar ? 'button' : 'presentation'}
      aria-label={aoBuscar ? 'Barra da faixa: clique para avançar' : undefined}
    >
      {valores.map((v, i) => {
        // Piso de 2px: trecho em silencio vira um ponto, e nao um buraco na
        // onda, senao parece falha de carregamento.
        const h = Math.max(v * altura, 2);
        return (
          <rect
            key={i}
            x={i * 3}
            y={(altura - h) / 2}
            width="2"
            height={h}
            rx="1"
            className={i < corte ? 'onda-tocada' : 'onda-resto'}
          />
        );
      })}
    </svg>
  );
}
