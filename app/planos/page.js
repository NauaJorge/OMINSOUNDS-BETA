import Link from 'next/link';

export const metadata = { title: 'Planos | OMINSOUNDS' };

const planos = [
  {
    faixa: 'Entrada',
    nome: 'De Cria',
    resumo: 'Para testar a plataforma e montar sua primeira vitrine.',
    valor: 'Grátis',
    itens: [
      'Perfil público básico',
      'Até 3 beats publicados',
      'Contato direto com artistas',
      'Página simples de apresentação',
    ],
  },
  {
    faixa: 'Crescimento',
    nome: 'Silver',
    resumo: 'Para produtores com catálogo em expansão.',
    valor: 'R$ 29',
    periodo: '/mês',
    itens: [
      'Até 25 beats publicados',
      'Licenças básica e premium',
      'Estatísticas de plays e favoritos',
      'Suporte para vitrine de serviços',
    ],
  },
  {
    faixa: 'Mais forte',
    nome: 'Professional',
    resumo: 'Para quem quer vender com destaque e operar como loja.',
    valor: 'R$ 79',
    periodo: '/mês',
    destaque: true,
    itens: [
      'Catálogo ilimitado',
      'Destaque em buscas e categorias',
      'Licenças exclusivas',
      'Perfil com prova social e campanhas',
    ],
  },
];

export default function Planos() {
  return (
    <div className="container secao">
      <span className="olho">Planos</span>
      <h1>Escolha como sua música aparece.</h1>
      <p className="leve" style={{ maxWidth: '68ch', fontSize: 18 }}>
        Comece com uma vitrine simples ou use recursos de destaque para vender
        beats, serviços e licenças com mais presença.
      </p>

      <div className="grade grade-3" style={{ marginTop: 34, alignItems: 'stretch' }}>
        {planos.map((p) => (
          <article className={`cartao plano ${p.destaque ? 'plano-destaque' : ''}`} key={p.nome}>
            <div className="cartao-corpo">
              <span className="olho" style={{ marginBottom: 8 }}>{p.faixa}</span>
              <h2 style={{ fontSize: 24 }}>{p.nome}</h2>
              <p className="leve" style={{ fontSize: 14.5, minHeight: 44 }}>{p.resumo}</p>

              <p className="plano-valor">
                {p.valor}
                {p.periodo && <span className="mini">{p.periodo}</span>}
              </p>

              <ul className="plano-itens">
                {p.itens.map((i) => <li key={i}>{i}</li>)}
              </ul>

              <Link
                className={`btn btn-bloco ${p.destaque ? 'btn-ouro' : 'btn-linha'}`}
                href="/cadastrar"
              >
                {p.valor === 'Grátis' ? 'Começar' : `Assinar ${p.nome}`}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="cartao" style={{ marginTop: 30 }}>
        <div className="cartao-corpo">
          <span className="olho">Para artistas</span>
          <h2 style={{ fontSize: 22 }}>Comprar beats continua simples.</h2>
          <p className="leve" style={{ marginBottom: 16 }}>
            Os planos são para produtores e studios. Quem só quer comprar navega,
            salva favoritos e leva a licença sem assinar nada.
          </p>
          <Link className="btn btn-linha" href="/beats">Explorar beats</Link>
        </div>
      </div>

      <p className="cofre" style={{ marginTop: 26 }}>
        Ambiente de teste: os botões levam para o login, não para cobrança. O
        pagamento fica para depois, por decisão do Diretor — o projeto não está
        sendo cobrado nesta fase.
      </p>
    </div>
  );
}
