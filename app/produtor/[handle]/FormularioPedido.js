'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { enviarPedido } from '../../acoes';

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-ouro btn-bloco" type="submit" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar pedido de conversa'}
    </button>
  );
}

export default function FormularioPedido({ handle, nome }) {
  const [estado, acao] = useActionState(enviarPedido, {});

  if (estado?.ok) {
    return <p className="aviso aviso-ok" style={{ margin: 0 }}>{estado.ok}</p>;
  }

  return (
    <form action={acao}>
      <input type="hidden" name="para" value={handle} />
      {estado?.erro && <p className="aviso aviso-erro" role="alert">{estado.erro}</p>}

      <label className="campo-rotulo" htmlFor="assunto">
        Assunto
        <input className="campo" id="assunto" name="assunto" maxLength={120}
               placeholder="Ex.: licença exclusiva do Noite Alta" />
      </label>

      <label className="campo-rotulo" htmlFor="corpo">
        Mensagem
        <textarea className="campo" id="corpo" name="corpo" maxLength={2000} required
                  placeholder={`Escreva para ${nome}…`} />
      </label>

      <Botao />

      <p className="cofre" style={{ marginTop: 14 }}>
        {nome} vai ver que você pediu para falar, e quando. O texto acima fica
        retido até o aceite — nem o assunto aparece antes disso.
      </p>
    </form>
  );
}
