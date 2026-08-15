'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cadastrar } from '../acoes';
import { normalizarHandle } from '../../lib/handle';

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-ouro btn-bloco" type="submit" disabled={pending}>
      {pending ? 'Criando conta…' : 'Criar minha conta'}
    </button>
  );
}

export default function FormularioCadastro() {
  const [estado, acao] = useActionState(cadastrar, {});
  const erros = estado?.erros ?? {};
  const eco = estado?.eco ?? {};

  const [handle, setHandle] = useState(eco.handle ?? '');
  const [tocouHandle, setTocouHandle] = useState(false);

  // Enquanto a pessoa nao mexer no @, ele acompanha o nome. Depois que mexe,
  // para de acompanhar: quem escolheu o proprio @ nao quer ver ele mudando
  // sozinho ao corrigir o nome.
  function aoDigitarNome(e) {
    if (!tocouHandle) setHandle(normalizarHandle(e.target.value).slice(0, 20));
  }

  return (
    <form action={acao} noValidate>
      <label className="campo-rotulo" htmlFor="nome">
        Nome ou nome artístico
        <input
          className={`campo ${erros.nome ? 'campo-erro' : ''}`}
          id="nome" name="nome" defaultValue={eco.nome ?? ''}
          onChange={aoDigitarNome} maxLength={60} autoComplete="name" required
        />
        {erros.nome && <span className="erro-campo">{erros.nome}</span>}
      </label>

      <label className="campo-rotulo" htmlFor="handle">
        Seu @ na plataforma
        <span className="campo-com-prefixo">
          <span aria-hidden="true">@</span>
          <input
            className={`campo ${erros.handle ? 'campo-erro' : ''}`}
            id="handle" name="handle" value={handle}
            onChange={(e) => { setTocouHandle(true); setHandle(normalizarHandle(e.target.value).slice(0, 20)); }}
            maxLength={20} autoComplete="off" required
          />
        </span>
        <span className="mini">É o endereço do seu perfil: ominisounds.vercel.app/produtor/{handle || 'seu-nome'}</span>
        {erros.handle && <span className="erro-campo">{erros.handle}</span>}
      </label>

      <label className="campo-rotulo" htmlFor="email">
        E-mail
        <input
          className={`campo ${erros.email ? 'campo-erro' : ''}`}
          id="email" name="email" type="email" defaultValue={eco.email ?? ''}
          autoComplete="email" required
        />
        {erros.email && <span className="erro-campo">{erros.email}</span>}
      </label>

      <label className="campo-rotulo" htmlFor="senha">
        Senha
        <input
          className={`campo ${erros.senha ? 'campo-erro' : ''}`}
          id="senha" name="senha" type="password"
          autoComplete="new-password" minLength={8} required
        />
        <span className="mini">No mínimo 8 caracteres.</span>
        {erros.senha && <span className="erro-campo">{erros.senha}</span>}
      </label>

      <Botao />
    </form>
  );
}
