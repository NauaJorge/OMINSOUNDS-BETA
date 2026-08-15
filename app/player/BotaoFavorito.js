'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { alternarFavorito } from '../acoes';

export default function BotaoFavorito({ beatId, favoritado, total, logado }) {
  const router = useRouter();
  const [marcado, setMarcado] = useState(Boolean(favoritado));
  const [conta, setConta] = useState(Number(total) || 0);
  const [pendente, iniciar] = useTransition();

  function clicar() {
    if (!logado) { router.push('/entrar'); return; }

    // Vira na hora e so depois confirma com o servidor. Coracao que demora
    // meio segundo para reagir parece que nao registrou, e a pessoa clica de
    // novo — desfazendo o que acabou de fazer.
    const novo = !marcado;
    setMarcado(novo);
    setConta((c) => Math.max(c + (novo ? 1 : -1), 0));

    iniciar(async () => {
      const r = await alternarFavorito(beatId);
      if (r?.erro) { setMarcado(!novo); setConta((c) => c + (novo ? -1 : 1)); return; }
      // O servidor tem a palavra final: se dois dispositivos mexeram, o
      // numero certo e o dele.
      setMarcado(r.favoritado);
      setConta(r.total);
    });
  }

  return (
    <button
      type="button"
      className={`favorito ${marcado ? 'favorito-ativo' : ''}`}
      onClick={clicar}
      disabled={pendente}
      aria-pressed={marcado}
      aria-label={marcado ? 'Tirar dos favoritos' : 'Salvar nos favoritos'}
      title={logado ? undefined : 'Entre para salvar'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5c0 5-7 9.5-7 9.5z" />
      </svg>
      <span className="mini">{conta}</span>
    </button>
  );
}
