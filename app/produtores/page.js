import Link from 'next/link';
import { sql } from '../../lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Produtores | OMINSOUNDS' };

export default async function Produtores() {
  const lista = await sql`
    SELECT handle, nome, bio, cidade, avatar_url,
           (SELECT count(*)::int FROM beats WHERE produtor_id = usuarios.id AND publicado) AS qtd
    FROM usuarios WHERE papel = 'produtor' ORDER BY nome
  `;

  return (
    <div className="container secao">
      <span className="olho">Quem produz</span>
      <h1>Produtores</h1>
      <p className="leve" style={{ maxWidth: '58ch' }}>
        Cada perfil é uma vitrine própria. Para falar com alguém, você envia um
        pedido — e a conversa só abre se a pessoa aceitar.
      </p>

      <div className="grade grade-3" style={{ marginTop: 28 }}>
        {lista.map((p) => (
          <Link className="cartao" href={`/produtor/${p.handle}`} key={p.handle} style={{ textDecoration: 'none' }}>
            <div className="cartao-corpo">
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <img className="avatar" src={p.avatar_url || '/assents/img/user-circle.svg'} alt="" width="46" height="46" />
                <div>
                  <strong>{p.nome}</strong>
                  <div className="mini">
                    @{p.handle} · {p.qtd} {p.qtd === 1 ? 'beat' : 'beats'}
                    {p.cidade ? ` · ${p.cidade}` : ''}
                  </div>
                </div>
              </div>
              <p className="leve" style={{ fontSize: 14.5, marginBottom: 0, marginTop: 14 }}>{p.bio}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
