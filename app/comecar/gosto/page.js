import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../../lib/sessao';
import { opcoesDoCatalogo, posicaoDoPasso, precisaDeOnboarding, destinoFinal } from '../../../lib/onboarding';
import { guardarGosto } from '../acoes';
import Moldura from '../Moldura';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'O que você ouve | OMINSOUNDS' };

export default async function Gosto() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  if (!(await precisaDeOnboarding(usuario.id))) redirect(destinoFinal(usuario.papel));

  // Só oferece o que existe no catálogo: chip que não devolve resultado é
  // promessa quebrada logo na primeira tela.
  const { generos, moods } = await opcoesDoCatalogo();

  return (
    <Moldura
      posicao={posicaoDoPasso('artista', 'gosto')}
      titulo="O que você ouve?"
      apoio="Marque o que te interessa. Serve para te mostrar beat que combina."
      acao={guardarGosto}
      voltarPara="/comecar"
      destinoPular="/beats"
    >
      <fieldset className="grupo-chips">
        <legend className="mini">Gêneros</legend>
        <div className="chips">
          {generos.map((g) => (
            <label className="chip-toque" key={g}>
              <input type="checkbox" name="genero" value={g} />
              <span>{g}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grupo-chips">
        <legend className="mini">Mood</legend>
        <div className="chips">
          {moods.map((m) => (
            <label className="chip-toque" key={m}>
              <input type="checkbox" name="mood" value={m} />
              <span>{m}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </Moldura>
  );
}
