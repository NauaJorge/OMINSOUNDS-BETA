import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../../lib/sessao';
import { posicaoDoPasso, precisaDeOnboarding, destinoFinal } from '../../../lib/onboarding';
import Moldura from '../Moldura';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Como funciona | OMINSOUNDS' };

// Sem formulário: é a única tela de leitura do fluxo. Avançar é só seguir.
async function seguirAdiante() {
  'use server';
  redirect('/comecar/primeiro-beat');
}

export default async function ComoFunciona() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  if (!(await precisaDeOnboarding(usuario.id))) redirect(destinoFinal(usuario.papel));

  return (
    <Moldura
      posicao={posicaoDoPasso('produtor', 'como-funciona')}
      titulo="Como funciona aqui"
      apoio="Três coisas antes de você publicar."
      acao={seguirAdiante}
      rotuloEnviar="Entendi, continuar"
      voltarPara="/comecar/vitrine"
      destinoPular="/studio"
    >
      <ol className="lista-numerada">
        <li>
          <b>1</b>
          <div>
            <h3>Você define a licença</h3>
            <p className="leve">
              Básica em MP3, Premium com WAV, Trackout com os stems separados, e
              Exclusiva, que tira o beat do catálogo. Você escolhe o preço de cada uma.
            </p>
          </div>
        </li>
        <li>
          <b>2</b>
          <div>
            <h3>Ninguém te manda mensagem sem sua permissão</h3>
            <p className="leve">
              O pedido chega, você vê quem é e quando pediu, e decide. O texto só
              aparece depois do seu aceite — nem o assunto vaza antes.
            </p>
          </div>
        </li>
        <li>
          <b>3</b>
          <div>
            <h3>Seu catálogo é seu</h3>
            <p className="leve">
              Cada produtor vê só o próprio Studio, com os próprios números de
              plays, favoritos e pedidos.
            </p>
          </div>
        </li>
      </ol>
    </Moldura>
  );
}
