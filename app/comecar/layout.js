import Link from 'next/link';
import { sair } from '../acoes';

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
          <Link className="marca" href="/">
            <svg className="marca-sinal" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12h3l2-6 3 13 3-17 3 20 2.5-10H22" />
            </svg>
            <span>OMINSOUNDS</span>
          </Link>
          <form action={sair}>
            <button className="link-pular" type="submit">Sair</button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
