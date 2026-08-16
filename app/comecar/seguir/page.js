import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../../lib/sessao';
import {
  produtoresParaSeguir, posicaoDoPasso, precisaDeOnboarding, destinoFinal,
} from '../../../lib/onboarding';
import { seguirNoOnboarding, terminar } from '../acoes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Siga produtores | OMINSOUNDS' };

export default async function Seguir() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  if (!(await precisaDeOnboarding(usuario.id))) redirect(destinoFinal(usuario.papel));

  const produtores = await produtoresParaSeguir(usuario.id);
  const posicao = posicaoDoPasso('artista', 'seguir');
  const jaSegue = produtores.filter((p) => p.seguindo).length;

  return (
    <div className="comecar">
      <div className="comecar-barra" aria-label={`Passo ${posicao.atual} de ${posicao.total}`}>
        {Array.from({ length: posicao.total }, (_, i) => (
          <i key={i} className={i + 1 <= posicao.atual ? 'on' : ''} />
        ))}
      </div>
      <p className="mini comecar-contador">Passo {posicao.atual} de {posicao.total}</p>

      <h1>Siga alguns produtores</h1>
      <p className="leve comecar-apoio">
        Assim seu início já começa com música. Dá para deixar de seguir quando quiser.
      </p>

      {/*
        Cada seguir é um formulário próprio, e não um formulário grande com
        tudo dentro: a pessoa vê o botão mudar na hora e não precisa enviar
        nada para valer. Sem JavaScript de estado.
      */}
      <div className="lista-seguir">
        {produtores.map((p) => (
          <div className="linha-seguir" key={p.id}>
            <img
              className="avatar"
              src={p.avatar_url || '/assents/img/user-circle.svg'}
              alt="" width="44" height="44"
            />
            <div className="linha-seguir-corpo">
              <strong>{p.nome}</strong>
              <span className="mini">
                @{p.handle} · {p.qtd} {p.qtd === 1 ? 'beat' : 'beats'}
                {p.generos?.length ? ` · ${p.generos.slice(0, 2).join(', ')}` : ''}
              </span>
            </div>
            <form action={seguirNoOnboarding}>
              <input type="hidden" name="produtor" value={p.id} />
              <button className={`btn-seguir ${p.seguindo ? 'on' : ''}`} type="submit">
                {p.seguindo ? 'Seguindo' : 'Seguir'}
              </button>
            </form>
          </div>
        ))}
      </div>

      {produtores.length === 0 && (
        <p className="vazio">Ainda não há outros produtores na plataforma.</p>
      )}

      <form action={terminar} className="comecar-acoes">
        <input type="hidden" name="destino" value="/beats" />
        <button className="btn btn-ouro" type="submit">
          {jaSegue > 0 ? `Entrar seguindo ${jaSegue}` : 'Entrar na OMINSOUNDS'}
        </button>
        <a className="btn btn-linha" href="/comecar/objetivo">Voltar</a>
      </form>
    </div>
  );
}
