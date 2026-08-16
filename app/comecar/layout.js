import { sair } from '../acoes';
import Marca from '../componentes/Marca';

/*
  O onboarding não usa o menu do site. Com ele, a primeira tela oferecia
  "Beats", "Produtores", "Planos" e "Quero vender também" ao lado da pergunta
  que define o caminho — quatro saídas competindo com a única decisão pedida.

  Fica só a marca e o "Sair", que precisa existir para ninguém ficar preso.
*/
export default function LayoutComecar({ children }) {
  return (
    <>
      <header className="topo-comecar">
        <div className="topo-comecar-linha">
          <Marca />
          <form action={sair}>
            <button className="link-pular" type="submit">Sair</button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
