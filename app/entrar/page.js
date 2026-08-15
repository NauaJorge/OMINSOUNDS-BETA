import { redirect } from 'next/navigation';
import { usuarioAtual } from '../../lib/sessao';
import FormularioEntrar from './FormularioEntrar';

export const metadata = { title: 'Entrar | OMINSOUNDS' };

export default async function Entrar() {
  if (await usuarioAtual()) redirect('/studio');

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
            <p className="leve" style={{ marginTop: 0 }}>
              Use o e-mail e a senha da sua conta de teste.
            </p>
            <FormularioEntrar />
          </div>
        </div>
      </div>
    </div>
  );
}
