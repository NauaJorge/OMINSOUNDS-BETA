import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../../lib/sessao';
import { opcoesDoCatalogo, posicaoDoPasso, precisaDeOnboarding, destinoFinal } from '../../../lib/onboarding';
import { guardarVitrine } from '../acoes';
import Moldura from '../Moldura';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sua vitrine | OMINSOUNDS' };

export default async function Vitrine() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');
  if (!(await precisaDeOnboarding(usuario.id))) redirect(destinoFinal(usuario.papel));

  const { generos } = await opcoesDoCatalogo();

  return (
    <Moldura
      posicao={posicaoDoPasso('produtor', 'vitrine')}
      titulo="Sua vitrine"
      apoio="É o que o artista vê antes de te chamar. Tudo aqui é opcional e dá para mudar depois."
      acao={guardarVitrine}
      voltarPara="/comecar"
      destinoPular="/studio"
    >
      <p className="mini" style={{ marginBottom: 18 }}>
        Você entra como <strong>{usuario.nome}</strong>, em ominisounds.vercel.app/produtor/{usuario.handle}
      </p>

      <label className="campo-rotulo" htmlFor="bio">
        Bio
        <textarea
          className="campo" id="bio" name="bio" maxLength={400}
          defaultValue={usuario.bio || ''}
          placeholder="Fala do seu som em duas linhas."
        />
      </label>

      <label className="campo-rotulo" htmlFor="cidade">
        Cidade
        <input
          className="campo" id="cidade" name="cidade" maxLength={80}
          defaultValue={usuario.cidade || ''}
          placeholder="Rio de Janeiro, RJ"
        />
      </label>

      <fieldset className="grupo-chips">
        <legend className="mini">Estilos que você produz</legend>
        <div className="chips">
          {generos.map((g) => (
            <label className="chip-toque" key={g}>
              <input type="checkbox" name="genero" value={g} />
              <span>{g}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="cofre">
        Foto de perfil e capa entram no Studio, junto com o upload de beat.
      </p>
    </Moldura>
  );
}
