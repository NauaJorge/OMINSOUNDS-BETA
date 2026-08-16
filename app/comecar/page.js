import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../lib/sessao';
import { precisaDeOnboarding, destinoFinal } from '../../lib/onboarding';
import { escolherPapel } from './acoes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bem-vindo | OMINSOUNDS' };

export default async function Comecar() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  // Roda uma vez. Quem já passou por aqui vai direto para o seu lugar.
  if (!(await precisaDeOnboarding(usuario.id))) redirect(destinoFinal(usuario.papel));

  return (
    <div className="comecar">
      <div className="comecar-barra" aria-label="Passo 1 de 4">
        <i className="on" /><i /><i /><i />
      </div>
      <p className="mini comecar-contador">Passo 1 de 4</p>

      <h1>O que te traz à OMINSOUNDS?</h1>
      <p className="leve comecar-apoio">
        Dá para mudar depois. Isso só ajusta o que você vê primeiro.
      </p>

      {/*
        Único passo sem "fazer depois": a resposta define qual caminho existe
        a seguir. Pular aqui não deixaria nada para mostrar.
      */}
      <form action={escolherPapel} className="escolha-papel">
        <button className="cartao-papel" type="submit" name="papel" value="artista">
          <span className="cartao-papel-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v4"/></svg>
          </span>
          <strong>Quero achar beats</strong>
          <span className="leve">Canto, escrevo ou gravo. Vim procurar som.</span>
        </button>

        <button className="cartao-papel" type="submit" name="papel" value="produtor">
          <span className="cartao-papel-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 20V9M10 20V4M16 20v-7M22 20V7"/></svg>
          </span>
          <strong>Quero vender meus beats</strong>
          <span className="leve">Produzo e quero uma vitrine própria.</span>
        </button>
      </form>
    </div>
  );
}
