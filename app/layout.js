import './globals.css';
import Link from 'next/link';
import { headers } from 'next/headers';
import { usuarioAtual } from '../lib/sessao';
import { contarPendentes } from '../lib/mensagens';
import { sair } from './acoes';
import Player from './player/Player';
import { passarAVender } from './comecar/acoes';

export const metadata = {
  title: 'OMINSOUNDS — beats, produtores e serviços musicais',
  description:
    'Marketplace de beats. Catálogo de produtores, Studio próprio e mensagens que só chegam depois do aceite.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  // O onboarding tem cabecalho proprio, enxuto. Sem isto o menu do site
  // inteiro competia com a pergunta que define o caminho.
  const caminho = (await headers()).get('x-caminho') ?? '';
  const noOnboarding = caminho.startsWith('/comecar');

  const usuario = await usuarioAtual();
  const pendentes = usuario ? await contarPendentes(usuario.id) : 0;

  return (
    <html lang="pt-BR">
      <body>
        <a className="sr" href="#conteudo">Pular para o conteúdo</a>

        {!noOnboarding && (
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
              {usuario?.papel === 'artista' && <Link href="/feed">Início</Link>}
              <Link href="/beats">Beats</Link>
              <Link href="/produtores">Produtores</Link>
              <Link href="/planos">Planos</Link>
              {usuario?.papel === 'produtor' && <Link href="/studio">Studio</Link>}
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
                  {/* O "Become a Seller" da BeatStars: artista vira produtor
                      sem perder nada, e cai direto no onboarding da vitrine. */}
                  {usuario.papel === 'artista' && (
                    <form action={passarAVender}>
                      <button className="btn btn-linha btn-vender" type="submit">
                        Quero vender também
                      </button>
                    </form>
                  )}
                  <span className="mini">@{usuario.handle}</span>
                  <form action={sair}>
                    <button className="btn btn-fantasma" type="submit">Sair</button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="btn btn-fantasma" href="/entrar">Entrar</Link>
                  <Link className="btn btn-ouro" href="/cadastrar">Criar conta</Link>
                </>
              )}
            </div>
          </div>
        </header>
        )}

        <Player>
          <main id="conteudo">{children}</main>

          {!noOnboarding && (
          <footer className="rodape">
            <div className="container rodape-grade">
              <div className="rodape-marca">
                <Link className="marca" href="/">
                  <svg className="marca-sinal" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12h3l2-6 3 13 3-17 3 20 2.5-10H22" />
                  </svg>
                  <span>OMINSOUNDS</span>
                </Link>
                <p>
                  Marketplace de beats para artistas encontrarem sons e produtores
                  venderem com vitrine própria.
                </p>
              </div>

              <nav className="rodape-coluna" aria-label="Links da plataforma">
                <strong>Plataforma</strong>
                {usuario?.papel === 'artista' && <Link href="/feed">Início</Link>}
              <Link href="/beats">Beats</Link>
                <Link href="/produtores">Produtores</Link>
                <Link href="/planos">Planos</Link>
                <Link href="/entrar">Entrar</Link>
              </nav>

              <nav className="rodape-coluna" aria-label="Links para produtores">
                <strong>Para produtores</strong>
                <Link href="/cadastrar">Criar conta</Link>
                <Link href="/studio">Studio</Link>
                <Link href="/planos">Comparar planos</Link>
              </nav>
            </div>

            <div className="container rodape-base">
              <div className="mini">
                Ambiente de teste. Catálogo, contas e pagamentos podem estar em modo de configuração.
              </div>
              <div className="mini credito">
                Desenvolvido pela{' '}
                <a href="https://www.softwavesolucoes.com.br/" target="_blank" rel="noopener">
                  SoftWave Soluções<span className="sr">, abre em outra aba</span>
                </a>
              </div>
            </div>
          </footer>
          )}
        </Player>
      </body>
    </html>
  );
}
