import './globals.css';
import Link from 'next/link';
import { usuarioAtual } from '../lib/sessao';
import { contarPendentes } from '../lib/mensagens';
import { sair } from './acoes';
import Player from './player/Player';

export const metadata = {
  title: 'OMINSOUNDS — beats, produtores e serviços musicais',
  description:
    'Marketplace de beats. Catálogo de produtores, Studio próprio e mensagens que só chegam depois do aceite.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const usuario = await usuarioAtual();
  const pendentes = usuario ? await contarPendentes(usuario.id) : 0;

  return (
    <html lang="pt-BR">
      <body>
        <a className="sr" href="#conteudo">Pular para o conteúdo</a>

        <header className="topo">
          <div className="topo-linha">
            <Link className="marca" href="/">
              {/* Marca desenhada em SVG. A imagem que estava aqui era o selo
                  "SMT" da Smooth, que saiu do site por decisao do Diretor, e
                  ainda por cima era um PNG de 1 KB que aparecia serrilhado. */}
              <svg className="marca-sinal" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12h3l2-6 3 13 3-17 3 20 2.5-10H22" />
              </svg>
              <span>OMINSOUNDS</span>
            </Link>

            <nav className="menu" aria-label="Navegação principal">
              <Link href="/beats">Beats</Link>
              <Link href="/produtores">Produtores</Link>
              <Link href="/planos">Planos</Link>
              {usuario && <Link href="/studio">Studio</Link>}
              {usuario && (
                <Link href="/mensagens">
                  Mensagens
                  {pendentes > 0 && (
                    <span className="selo-pendente" aria-label={`${pendentes} pedidos esperando resposta`}>
                      {pendentes}
                    </span>
                  )}
                </Link>
              )}
            </nav>

            <div className="topo-acoes">
              {usuario ? (
                <>
                  <span className="mini">@{usuario.handle}</span>
                  <form action={sair}>
                    <button className="btn btn-fantasma" type="submit">Sair</button>
                  </form>
                </>
              ) : (
                <Link className="btn btn-ouro" href="/entrar">Entrar</Link>
              )}
            </div>
          </div>
        </header>

        <Player>
          <main id="conteudo">{children}</main>

          <footer className="rodape">
            <div className="container rodape-linha">
              <div>
                <strong>OMINSOUNDS</strong>
                <div className="mini credito">
                  Desenvolvido pela{' '}
                  <a href="https://www.softwavesolucoes.com.br/" target="_blank" rel="noopener">
                    SoftWave Soluções<span className="sr">, abre em outra aba</span>
                  </a>
                </div>
              </div>
              <div className="mini">
                Ambiente de teste. Catálogo e contas são demonstração.
              </div>
            </div>
          </footer>
        </Player>
      </body>
    </html>
  );
}
