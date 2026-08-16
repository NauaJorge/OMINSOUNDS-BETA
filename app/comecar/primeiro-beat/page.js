import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../../lib/sessao';
import { posicaoDoPasso, precisaDeOnboarding, destinoFinal } from '../../../lib/onboarding';
import { terminar } from '../acoes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Seu primeiro beat | OMINSOUNDS' };

export default async function PrimeiroBeat() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  if (!(await precisaDeOnboarding(usuario.id))) redirect(destinoFinal(usuario.papel));

  const posicao = posicaoDoPasso('produtor', 'primeiro-beat');

  return (
    <div className="comecar">
      <div className="comecar-barra" aria-label={`Passo ${posicao.atual} de ${posicao.total}`}>
        {Array.from({ length: posicao.total }, (_, i) => (
          <i key={i} className={i + 1 <= posicao.atual ? 'on' : ''} />
        ))}
      </div>
      <p className="mini comecar-contador">Passo {posicao.atual} de {posicao.total}</p>

      <h1>Falta o seu primeiro beat</h1>
      <p className="leve comecar-apoio">
        Perfil sem beat não aparece na busca. É o último passo para a vitrine
        existir de verdade.
      </p>

      {/*
        O upload ainda não existe — foi decisão do Diretor deixar para depois.
        Este passo é o convite, e diz a verdade sobre o estado da plataforma em
        vez de mostrar um formulário que não salva nada.
      */}
      <div className="cartao" style={{ marginTop: 8 }}>
        <div className="cartao-corpo">
          <h3>O que você vai precisar</h3>
          <ul className="lista-marcada" style={{ marginTop: 12 }}>
            <li>O áudio em MP3 ou WAV</li>
            <li>Uma capa quadrada</li>
            <li>BPM e tom — é por eles que o artista procura</li>
            <li>O preço de cada licença</li>
          </ul>
          <p className="cofre" style={{ marginTop: 16, marginBottom: 0 }}>
            Publicar beat pelo painel ainda está em construção. Nesta fase o
            catálogo vem do banco de teste — assim que o upload entrar, ele
            aparece aqui no Studio.
          </p>
        </div>
      </div>

      <form action={terminar} className="comecar-acoes">
        <input type="hidden" name="destino" value="/studio" />
        <button className="btn btn-ouro" type="submit">Abrir meu Studio</button>
        <a className="btn btn-linha" href="/comecar/como-funciona">Voltar</a>
      </form>
    </div>
  );
}
