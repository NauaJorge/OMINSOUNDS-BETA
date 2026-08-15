import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { usuarioAtual } from '../../../lib/sessao';
import { mensagensDaConversa } from '../../../lib/mensagens';
import FormularioResposta from './FormularioResposta';

export const metadata = { title: 'Conversa | OMINSOUNDS' };

export default async function Conversa({ params }) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');

  // Devolve null tanto para conversa inexistente quanto para conversa que nao
  // e minha ou que ainda nao foi aceita. Trocar o id na barra de endereco nao
  // abre a conversa de ninguem.
  const dados = await mensagensDaConversa(Number(id), usuario.id);
  if (!dados) notFound();

  const { conversa, mensagens } = dados;

  return (
    <div className="container secao" style={{ maxWidth: 780 }}>
      <Link className="mini" href="/mensagens">← Voltar para as mensagens</Link>

      <div className="pedido" style={{ marginTop: 16, marginBottom: 22 }}>
        <img className="avatar" src={conversa.avatar_url || '/assents/img/user-circle.svg'} alt="" width="46" height="46" />
        <div>
          <strong>{conversa.nome}</strong>
          <div className="mini">@{conversa.handle}</div>
        </div>
        <Link className="btn btn-linha" href={`/produtor/${conversa.handle}`} style={{ marginLeft: 'auto' }}>
          Ver perfil
        </Link>
      </div>

      <div>
        {mensagens.map((m) => (
          <div
            className={`balao ${m.autor_id === usuario.id ? 'balao-meu' : 'balao-dele'}`}
            key={m.id}
          >
            <p>{m.corpo}</p>
            <time dateTime={new Date(m.criado_em).toISOString()}>
              {new Date(m.criado_em).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </time>
          </div>
        ))}
      </div>

      <FormularioResposta conversaId={conversa.id} />
    </div>
  );
}
