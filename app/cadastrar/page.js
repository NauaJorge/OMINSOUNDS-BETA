import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../lib/sessao';
import { googleConfigurado } from '../../lib/usuarios';
import FormularioCadastro from './FormularioCadastro';
import BotaoGoogle from '../entrar/BotaoGoogle';

export const metadata = { title: 'Criar conta | OMINSOUNDS' };
export const dynamic = 'force-dynamic';

export default async function Cadastrar() {
  if (await usuarioAtual()) redirect('/studio');
  const comGoogle = googleConfigurado();

  return (
    <div className="container secao">
      <div className="grade grade-2" style={{ alignItems: 'start', gap: 44 }}>
        <div>
          <span className="olho">Para produtores</span>
          <h1>Abra sua vitrine.</h1>
          <p className="leve" style={{ maxWidth: '48ch' }}>
            A conta é sua. O catálogo é seu, os números são seus e a caixa de
            mensagens é sua — ninguém fala com você sem o seu aceite.
          </p>

          <ul className="lista-marcada">
            <li>Perfil público com o seu @</li>
            <li>Studio com o seu catálogo e as suas métricas</li>
            <li>Pedidos de conversa que você aceita ou recusa</li>
          </ul>

          <p className="mini" style={{ marginTop: 22 }}>
            Já tem conta? <Link className="text-link" href="/entrar">Entrar</Link>
          </p>
        </div>

        <div className="cartao">
          <div className="cartao-corpo" style={{ padding: 26 }}>
            <h2 style={{ fontSize: 21 }}>Criar conta</h2>

            {comGoogle && (
              <>
                <BotaoGoogle rotulo="Criar conta com o Google" />
                <div className="ou"><span>ou com e-mail</span></div>
              </>
            )}

            <FormularioCadastro />

            <p className="mini" style={{ marginTop: 16, marginBottom: 0 }}>
              Ambiente de teste. Não use uma senha que você já usa em outro lugar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
