'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { seguirProdutor } from '../../comecar/acoes';

/**
 * Mesmo padrão do favorito: vira na hora e confirma depois. Botão de seguir
 * que demora a reagir faz a pessoa clicar de novo e desfazer o que acabou de
 * fazer.
 */
export default function BotaoSeguir({ produtorId, seguindo, logado, total }) {
  const router = useRouter();
  const [marcado, setMarcado] = useState(Boolean(seguindo));
  const [conta, setConta] = useState(Number(total) || 0);
  const [pendente, iniciar] = useTransition();

  function clicar() {
    if (!logado) { router.push('/entrar'); return; }

    const novo = !marcado;
    setMarcado(novo);
    setConta((c) => Math.max(c + (novo ? 1 : -1), 0));

    iniciar(async () => {
      const r = await seguirProdutor(produtorId);
      if (r?.erro) { setMarcado(!novo); setConta((c) => c + (novo ? -1 : 1)); return; }
      setMarcado(r.seguindo);
    });
  }

  return (
    <button
      className={`btn ${marcado ? 'btn-linha' : 'btn-ouro'} btn-bloco`}
      type="button" onClick={clicar} disabled={pendente}
      aria-pressed={marcado}
      title={logado ? undefined : 'Entre para seguir'}
    >
      {marcado ? 'Seguindo' : 'Seguir'}
      {conta > 0 && <span className="mini" style={{ marginLeft: 6 }}>· {conta}</span>}
    </button>
  );
}
