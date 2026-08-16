import Link from 'next/link';
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pagamento | OMINSOUNDS' };

const TEXTOS = {
  success: {
    titulo: 'Pagamento recebido pelo Mercado Pago.',
    corpo: 'A confirmação final chega por webhook. Assim que o Mercado Pago aprovar, a licença fica registrada no sistema.',
  },
  pending: {
    titulo: 'Pagamento em processamento.',
    corpo: 'PIX, cartão em análise ou outro meio pode levar alguns instantes. A liberação acontece quando o webhook confirmar o status.',
  },
  failure: {
    titulo: 'Pagamento não concluído.',
    corpo: 'Você pode tentar novamente ou escolher outra forma de pagamento no checkout.',
  },
};

export default async function RetornoPagamento({ searchParams }) {
  const params = await searchParams;
  const pedidoId = Number(params?.pedido);
  const status = String(params?.status || 'pending');
  const texto = TEXTOS[status] || TEXTOS.pending;

  const pedido = Number.isInteger(pedidoId)
    ? (await sql`SELECT id, descricao, status FROM pedidos WHERE id = ${pedidoId}`)[0]
    : null;

  return (
    <div className="container secao" style={{ maxWidth: 760 }}>
      <span className="olho">Pagamento</span>
      <h1>{texto.titulo}</h1>
      <p className="leve" style={{ fontSize: 18 }}>{texto.corpo}</p>

      {pedido && (
        <div className="cartao" style={{ marginTop: 24 }}>
          <div className="cartao-corpo">
            <span className="olho">Pedido #{pedido.id}</span>
            <h2 style={{ fontSize: 22 }}>{pedido.descricao}</h2>
            <p className="leve" style={{ marginBottom: 0 }}>
              Status no OMINSOUNDS: <strong>{pedido.status}</strong>
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
        <Link className="btn btn-ouro" href="/beats">Voltar ao catálogo</Link>
        <Link className="btn btn-linha" href="/">Início</Link>
      </div>
    </div>
  );
}
