import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../lib/sessao';
import {
  pedidosPendentes,
  conversasAceitas,
  meusPedidosEnviados,
} from '../../lib/mensagens';
import { aceitar, recusar } from '../acoes';

export const metadata = { title: 'Mensagens | OMINSOUNDS' };

function quando(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default async function Mensagens() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/entrar');

  const [pendentes, aceitas, enviados] = await Promise.all([
    pedidosPendentes(usuario.id),
    conversasAceitas(usuario.id),
    meusPedidosEnviados(usuario.id),
  ]);

  return (
    <div className="container secao">
      <span className="olho">Caixa de entrada</span>
      <h1>Mensagens</h1>
      <p className="leve" style={{ maxWidth: '62ch' }}>
        Ninguém fala com você sem passar por aqui primeiro. Você vê quem pediu e
        quando, decide, e só então o texto aparece.
      </p>

      <section className="secao" style={{ paddingTop: 34 }}>
        <div className="secao-titulo">
          <h2>Pedidos esperando resposta {pendentes.length > 0 && <span className="selo-pendente">{pendentes.length}</span>}</h2>
        </div>

        {pendentes.length === 0 ? (
          <p className="vazio">Nenhum pedido no momento.</p>
        ) : (
          <>
            {pendentes.map((p) => (
              <div className="pedido" key={p.id}>
                <img className="avatar" src={p.avatar_url || '/assents/img/user-circle.svg'} alt="" width="46" height="46" />
                <div>
                  <strong>{p.nome}</strong>
                  <div className="mini">
                    @{p.handle}{p.cidade ? ` · ${p.cidade}` : ''} · pediu em {quando(p.criado_em)}
                  </div>
                </div>
                <div className="pedido-acoes">
                  <form action={aceitar}>
                    <input type="hidden" name="conversa" value={p.id} />
                    <button className="btn btn-ouro" type="submit">Aceitar e ler</button>
                  </form>
                  <form action={recusar}>
                    <input type="hidden" name="conversa" value={p.id} />
                    <button className="btn btn-perigo" type="submit">Recusar</button>
                  </form>
                </div>
              </div>
            ))}

            <p className="cofre">
              A mensagem existe, mas o texto não sai do banco enquanto o pedido
              estiver aqui. Nem o assunto. Por isso não há prévia nesta tela: se
              houvesse, o aceite não serviria para nada.
            </p>
          </>
        )}
      </section>

      <section className="secao" style={{ paddingTop: 0 }}>
        <div className="secao-titulo"><h2>Conversas</h2></div>
        {aceitas.length === 0 ? (
          <p className="vazio">Nenhuma conversa aberta ainda.</p>
        ) : (
          aceitas.map((c) => (
            <Link className="pedido" href={`/mensagens/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
              <img className="avatar" src={c.avatar_url || '/assents/img/user-circle.svg'} alt="" width="46" height="46" />
              <div style={{ minWidth: 0 }}>
                <strong>{c.nome}</strong>
                <div className="mini" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.ultima}
                </div>
              </div>
              <span className="mini" style={{ marginLeft: 'auto' }}>
                {c.ultima_em ? quando(c.ultima_em) : quando(c.criado_em)}
              </span>
            </Link>
          ))
        )}
      </section>

      {enviados.length > 0 && (
        <section className="secao" style={{ paddingTop: 0 }}>
          <div className="secao-titulo"><h2>Pedidos que você enviou</h2></div>
          {enviados.map((e) => (
            <div className="pedido" key={e.id}>
              <div>
                <strong>{e.nome}</strong>
                <div className="mini">@{e.handle} · enviado em {quando(e.criado_em)}</div>
              </div>
              <span className="etiqueta" style={{ marginLeft: 'auto' }}>
                {e.situacao === 'pendente' ? 'esperando aceite' : 'recusado'}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
