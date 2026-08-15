import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../lib/sessao';
import { googleConfigurado } from '../../lib/usuarios';
import FormularioEntrar from './FormularioEntrar';
import BotaoGoogle from './BotaoGoogle';

export const metadata = { title: 'Entrar | OMINSOUNDS' };
export const dynamic = 'force-dynamic';

const MENSAGENS = {
  'google-desligado': 'A entrada pelo Google ainda não está ligada nesta instalação.',
  'google-cancelado': 'Você cancelou a entrada pelo Google.',
  'google-state': 'O pedido expirou ou veio de outra aba. Tente de novo.',
  'google-sem-codigo': 'O Google não devolveu o código de acesso.',
  'google-token': 'Não foi possível confirmar sua conta com o Google.',
  'google-perfil': 'Não foi possível ler seu perfil do Google.',
  'google-sem-email': 'Sua conta Google não devolveu um e-mail.',
  'google-email-nao-verificado': 'O e-mail dessa conta Google não está confirmado.',
};

export default async function Entrar({ searchParams }) {
  if (await usuarioAtual()) redirect('/studio');

  const { erro } = await searchParams;
  const aviso = MENSAGENS[erro];
  const comGoogle = googleConfigurado();

  return (
    <div className="container secao">
      <div className="grade grade-2" style={{ alignItems: 'center', gap: 44 }}>
        <div>
          <span className="olho">Conta OMINSOUNDS</span>
          <h1>Entre e abra seu Studio.</h1>
          <p className="leve">
            O Studio é seu painel: seus beats, seus números e sua caixa de mensagens.
            Cada produtor vê o próprio catálogo, ninguém vê o do outro.
          </p>

          <div className="cartao" style={{ marginTop: 26 }}>
            <div className="cartao-corpo">
              <h3>Mensagem só chega com aceite</h3>
              <p className="leve" style={{ margin: 0, fontSize: 15 }}>
                Quando alguém te procura, você vê quem é e quando pediu. O texto
                fica retido até você aceitar. Não existe prévia, nem no aplicativo
                nem na notificação.
              </p>
            </div>
          </div>
        </div>

        <div className="cartao">
          <div className="cartao-corpo" style={{ padding: 26 }}>
            <h2>Login</h2>

            {aviso && <p className="aviso aviso-erro" role="alert">{aviso}</p>}

            {comGoogle && (
              <>
                <BotaoGoogle />
                <div className="ou"><span>ou com e-mail</span></div>
              </>
            )}

            <FormularioEntrar />

            <p className="mini" style={{ marginTop: 18, marginBottom: 0 }}>
              Ainda não tem conta? <Link className="text-link" href="/cadastrar">Criar conta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
