import { terminar } from './acoes';

/**
 * Moldura de todos os passos: barra de progresso, título e as ações do rodapé.
 * Centralizar aqui evita que cada passo invente o seu próprio "fazer depois" —
 * e é o botão que garante que o onboarding não vire prisão.
 */
export default function Moldura({
  posicao, titulo, apoio, children,
  acao, rotuloEnviar = 'Continuar',
  voltarPara, mostrarPular = true, destinoPular,
}) {
  const passos = Array.from({ length: posicao.total }, (_, i) => i + 1);

  return (
    <div className="comecar">
      <div className="comecar-barra" aria-label={`Passo ${posicao.atual} de ${posicao.total}`}>
        {passos.map((n) => (
          <i key={n} className={n <= posicao.atual ? 'on' : ''} />
        ))}
      </div>
      <p className="mini comecar-contador">Passo {posicao.atual} de {posicao.total}</p>

      <h1>{titulo}</h1>
      {apoio && <p className="leve comecar-apoio">{apoio}</p>}

      <form action={acao}>
        {children}

        <div className="comecar-acoes">
          <button className="btn btn-ouro" type="submit">{rotuloEnviar}</button>
          {voltarPara && (
            <a className="btn btn-linha" href={voltarPara}>Voltar</a>
          )}
        </div>
      </form>

      {mostrarPular && (
        <form action={terminar} className="comecar-pular">
          {destinoPular && <input type="hidden" name="destino" value={destinoPular} />}
          <button className="link-pular" type="submit">Fazer depois</button>
        </form>
      )}
    </div>
  );
}
