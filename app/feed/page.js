import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql } from '../../lib/db';
import { usuarioAtual } from '../../lib/sessao';
import { codigoCamelot } from '../../lib/harmonia';
import {
  deQuemSegue, peloGosto, peloObjetivo, paraCompletar,
  contarSeguindo, paraFila,
} from '../../lib/descoberta';
import LinhaBeat from '../player/LinhaBeat';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Seu início | OMINSOUNDS' };

function Faixa({ titulo, explica, beats, meus, logado, acao }) {
  if (!beats.length) return null;
  const lista = paraFila(beats);

  return (
    <section className="secao" style={{ paddingTop: 0, paddingBottom: 34 }}>
      <div className="secao-titulo" style={{ alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 21, margin: 0 }}>{titulo}</h2>
          {explica && <p className="mini" style={{ margin: '4px 0 0' }}>{explica}</p>}
        </div>
        {acao}
      </div>
      <ol className="lista-beats">
        {beats.map((b, i) => (
          <LinhaBeat
            key={b.id}
            beat={{ ...b, camelot: codigoCamelot(b.tom), favoritado: meus.has(b.id) }}
            indice={i} lista={lista} mostrarProdutor logado={logado}
          />
        ))}
      </ol>
    </section>
  );
}

export default async function Feed() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');

  const [seguindo, deSeguidos, doGosto, { ajuste, beats: doObjetivo }] = await Promise.all([
    contarSeguindo(usuario.id),
    deQuemSegue(usuario.id),
    peloGosto(usuario.id),
    peloObjetivo(usuario.objetivo),
  ]);

  // Sem repetir o mesmo beat em duas faixas: ver a mesma capa três vezes numa
  // rolagem faz o catálogo parecer menor do que é.
  //
  // A ordem aqui importa. A faixa do objetivo é servida primeiro porque é a
  // resposta direta ao que a pessoa declarou — e num catálogo pequeno ela era
  // justamente a que sobrava vazia, já que os mesmos beats apareciam antes nas
  // outras duas. A faixa que responde à pergunta não pode ser a que some.
  const vistos = new Set();
  const semRepetir = (lista) => lista.filter((b) => !vistos.has(b.id) && vistos.add(b.id));

  const faixaObjetivo = semRepetir(doObjetivo);
  const faixaSeguidos = semRepetir(deSeguidos);
  const faixaGosto = semRepetir(doGosto);

  // Só completa se o feed ficou magro; senão vira lista genérica no fim.
  const total = faixaSeguidos.length + faixaGosto.length + faixaObjetivo.length;
  const resto = total < 6 ? semRepetir(await paraCompletar(usuario.id, [...vistos])) : [];

  const meus = new Set(
    (await sql`SELECT beat_id FROM favoritos WHERE usuario_id = ${usuario.id}`).map((f) => f.beat_id)
  );

  const generos = usuario.preferencias_generos ?? [];
  const vazio = total === 0 && resto.length === 0;

  return (
    <div className="container secao">
      <span className="olho">Seu início</span>
      <h1 style={{ marginBottom: 8 }}>Oi, {usuario.nome.split(' ')[0]}.</h1>
      <p className="leve" style={{ maxWidth: '56ch' }}>
        {seguindo > 0
          ? `Você segue ${seguindo} ${seguindo === 1 ? 'produtor' : 'produtores'}. Aqui está o que eles publicaram e o que combina com o que você marcou.`
          : 'Aqui fica o que combina com o que você marcou. Seguir produtores enche esta página com o que eles publicam.'}
      </p>

      {generos.length > 0 && (
        <div className="beat-meta" style={{ marginTop: 16 }}>
          {generos.map((g) => (
            <Link className="etiqueta" key={g} href={`/beats?genero=${encodeURIComponent(g)}`}>{g}</Link>
          ))}
          <Link className="etiqueta" href="/comecar/gosto">mudar</Link>
        </div>
      )}

      <div style={{ marginTop: 34 }}>
        {ajuste && (
          <Faixa
            titulo={ajuste.titulo}
            explica={ajuste.explica}
            beats={faixaObjetivo} meus={meus} logado
          />
        )}

        <Faixa
          titulo="De quem você segue"
          explica="Publicado por produtores que você acompanha."
          beats={faixaSeguidos} meus={meus} logado
          acao={<Link className="btn btn-fantasma" href="/produtores">Seguir mais</Link>}
        />

        <Faixa
          titulo="Do seu gosto"
          explica={generos.length ? `Nos estilos que você marcou: ${generos.join(', ')}.` : 'Nos estilos que você marcou.'}
          beats={faixaGosto} meus={meus} logado
          acao={<Link className="btn btn-fantasma" href="/beats">Ver catálogo</Link>}
        />

        <Faixa
          titulo="Mais tocados"
          explica="Para completar, o que mais toca na plataforma."
          beats={resto} meus={meus} logado
        />
      </div>

      {vazio && (
        <div className="vazio" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 14 }}>
            Ainda não há nada aqui. Siga alguns produtores ou marque os estilos que você curte.
          </p>
          <Link className="btn btn-ouro" href="/produtores">Ver produtores</Link>
        </div>
      )}

      {seguindo === 0 && !vazio && (
        <p className="cofre">
          Você ainda não segue ninguém. Seguir produtores faz esta página mostrar
          o que eles publicam, e não só o que combina com os seus estilos.
        </p>
      )}
    </div>
  );
}
