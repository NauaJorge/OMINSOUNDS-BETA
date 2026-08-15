import './globals.css';
import Link from 'next/link';
import { usuarioAtual } from '../lib/sessao';
import { contarPendentes } from '../lib/mensagens';
import { sair } from './acoes';
import Player from './player/Player';

export const metadata = {
  title: 'OMINSOUNDS — beats, produtores e serviços musicais',
  description:
    'Marketplace de beats da Smooth Produções. Catálogo de produtores, Studio próprio e mensagens que só chegam depois do aceite.',
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
              <img src="/assents/img/logo-botao.png" alt="" width="26" height="26" />
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
                <div className="mini">Produto da Smooth Produções. Parte técnica pela SoftWave Soluções.</div>
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
