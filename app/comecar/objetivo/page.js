import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../../lib/sessao';
import { OBJETIVOS, posicaoDoPasso, precisaDeOnboarding, destinoFinal } from '../../../lib/onboarding';
import { guardarObjetivo } from '../acoes';
import Moldura from '../Moldura';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Para que procura beat | OMINSOUNDS' };

export default async function Objetivo() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  if (!(await precisaDeOnboarding(usuario.id))) redirect(destinoFinal(usuario.papel));

  return (
    <Moldura
      posicao={posicaoDoPasso('artista', 'objetivo')}
      titulo="Para que você procura beat?"
      apoio="Uma resposta. Muda o que a gente coloca na frente."
      acao={guardarObjetivo}
      voltarPara="/comecar/gosto"
      destinoPular="/beats"
    >
      <div className="lista-radio">
        {OBJETIVOS.map((o) => (
          <label className="radio-linha" key={o.valor}>
            <input type="radio" name="objetivo" value={o.valor} />
            <span className="radio-marca" aria-hidden="true" />
            <span>
              <strong>{o.titulo}</strong>
              <span className="mini">{o.ajuda}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="cofre">
        Quem escolhe projeto comercial vê Trackout e Exclusiva primeiro. Quem
        está explorando vê os beats grátis. A resposta muda a ordem do catálogo.
      </p>
    </Moldura>
  );
}
