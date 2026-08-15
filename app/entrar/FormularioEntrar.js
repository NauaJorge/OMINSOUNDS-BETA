'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { entrar } from '../acoes';

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-ouro btn-bloco" type="submit" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  );
}

export default function FormularioEntrar() {
  const [estado, acao] = useActionState(entrar, {});

  return (
    <form action={acao}>
      {estado?.erro && (
        <p className="aviso aviso-erro" role="alert">{estado.erro}</p>
      )}

      <label className="campo-rotulo" htmlFor="email">
        E-mail
        <input
          className="campo"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@ominisounds.test"
          required
        />
      </label>

      <label className="campo-rotulo" htmlFor="senha">
        Senha
        <input
          className="campo"
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      <Botao />
    </form>
  );
}
