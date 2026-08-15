'use client';

import Link from 'next/link';
import { usarPlayer } from '../../player/Player';
import BotaoFavorito from '../../player/BotaoFavorito';
import Onda from '../../player/Onda';

/*
  A onda grande da pagina do beat mostra o progresso real e aceita clique para
  avancar, porque aqui a pessoa esta decidindo se compra: ela quer chegar
  direto no refrao, e nao ouvir os 30 segundos em ordem.
*/
export default function CabecalhoBeat({ faixa, beat, camelot, favoritado, logado }) {
  const { atual, tocando, tocar, progresso } = usarPlayer();
  const eAtual = atual?.id === beat.id;

  return (
    <div className="beat-cabecalho">
      <img className="beat-cabecalho-capa" src={beat.capa_url} alt="" width="260" height="260" />

      <div className="beat-cabecalho-corpo">
        <span className="olho">{beat.genero}</span>
        <h1>{beat.titulo}</h1>
        <p className="mini" style={{ marginTop: 0 }}>
          <Link href={`/produtor/${beat.handle}`}>{beat.produtor}</Link>
          {' · '}{beat.bpm} BPM · {beat.tom}
          {camelot && <span className="camelot">{camelot}</span>}
        </p>

        <div className="beat-cabecalho-onda">
          <Onda picos={faixa.picos} progresso={eAtual ? progresso : 0} altura={62} />
        </div>

        <div className="beat-cabecalho-acoes">
          <button className="btn btn-ouro" type="button" onClick={() => tocar(faixa)}>
            {eAtual && tocando ? (
              <><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg> Pausar</>
            ) : (
              <><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg> Ouvir prévia</>
            )}
          </button>

          <BotaoFavorito
            beatId={beat.id} favoritado={favoritado}
            total={beat.favoritos} logado={logado}
          />

          <Link className="btn btn-linha" href={`/produtor/${beat.handle}`}>
            Falar com {beat.produtor.split(' ')[0]}
          </Link>
        </div>
      </div>
    </div>
  );
}
