'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { responder } from '../../acoes';

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-ouro" type="submit" disabled={pending}>
      {pending ? 'Enviando…' : 'Responder'}
    </button>
  );
}

export default function FormularioResposta({ conversaId }) {
  const [estado, acao] = useActionState(responder, {});
  const ref = useRef(null);

  useEffect(() => {
    if (estado?.ok) ref.current?.reset();
  }, [estado]);

  return (
    <form action={acao} ref={ref} style={{ marginTop: 20 }}>
      <input type="hidden" name="conversa" value={conversaId} />
      {estado?.erro && <p className="aviso aviso-erro" role="alert">{estado.erro}</p>}
      <label className="campo-rotulo" htmlFor="corpo">
        <span className="sr">Sua resposta</span>
        <textarea
          className="campo"
          id="corpo"
          name="corpo"
          placeholder="Escreva sua resposta…"
          maxLength={2000}
          required
        />
      </label>
      <Botao />
    </form>
  );
}
