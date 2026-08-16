'use client';

import { useState } from 'react';
import { iniciarPagamentoLicenca } from '../../acoes';

function real(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/*
  Seletor de licença, como no BeatStars: as opções lado a lado e o total lá em
  cima reagindo à escolha.

  Antes eram quatro blocos empilhados, cada um com o próprio botão de compra.
  Comparar exigia ler um de cada vez, e não havia um lugar só dizendo quanto
  vai sair — que é a informação que a pessoa procura antes de decidir.
*/
export default function Licencas({ licencas, gratis, pagamentoLigado }) {
  const [escolhida, setEscolhida] = useState(licencas[0]?.id);
  const atual = licencas.find((l) => l.id === escolhida) ?? licencas[0];

  if (!licencas.length) return null;

  return (
    <div className="licencas-bloco">
      <div className="licencas-topo">
        <div>
          <span className="mini">Total</span>
          <strong className="licencas-total">
            {atual.preco_centavos === 0 ? 'Grátis' : real(atual.preco_centavos)}
          </strong>
          <span className="mini">{atual.nome}</span>
        </div>

        {!gratis && (
          <form action={iniciarPagamentoLicenca}>
            <input type="hidden" name="licenca" value={atual.id} />
            <button className="btn btn-ouro" type="submit" disabled={!pagamentoLigado}>
              {pagamentoLigado ? 'Pagar com Pix ou cartão' : 'Pagamento em configuração'}
            </button>
          </form>
        )}
      </div>

      <div className="licencas-grade" role="radiogroup" aria-label="Escolha a licença">
        {licencas.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={l.id === escolhida}
            className={`licenca-op ${l.id === escolhida ? 'on' : ''} ${l.exclusiva ? 'exclusiva' : ''}`}
            onClick={() => setEscolhida(l.id)}
          >
            <span className="licenca-op-nome">{l.nome}</span>
            <strong className="licenca-op-preco">
              {l.preco_centavos === 0 ? 'Grátis' : real(l.preco_centavos)}
            </strong>
            <span className="mini">{l.formatos}</span>
          </button>
        ))}
      </div>

      {/*
        Os limites viram números com rótulo, e não texto corrido: é assim que
        se compara de relance qual licença cobre o uso que a pessoa tem em
        mente. O texto original fica embaixo, porque ele é o que vale
        juridicamente.
      */}
      {atual.limites?.length > 0 && (
        <div className="limites">
          {atual.limites.map((li) => (
            <div className="limite" key={li.rotulo}>
              <strong>{li.valor}</strong>
              <span className="mini">{li.rotulo}</span>
            </div>
          ))}
        </div>
      )}

      <p className="licenca-uso">{atual.uso}</p>
    </div>
  );
}
