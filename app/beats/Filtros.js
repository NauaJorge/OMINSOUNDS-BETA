'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/*
  Os filtros vivem na URL, e nao em estado do React. Assim o resultado
  filtrado pode ser copiado, mandado para alguem e recarregado sem sumir —
  e o botao de voltar do navegador funciona como a pessoa espera.
*/
export default function Filtros({ valores, opcoes, ordens }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = useState(valores.q ?? '');

  function aplicar(chave, valor) {
    const novo = new URLSearchParams(params.toString());
    if (valor) novo.set(chave, valor);
    else novo.delete(chave);
    router.push(`/beats?${novo.toString()}`, { scroll: false });
  }

  // Espera a pessoa parar de digitar antes de buscar: sem isso e uma consulta
  // por tecla apertada.
  useEffect(() => {
    if ((valores.q ?? '') === busca) return;
    const t = setTimeout(() => aplicar('q', busca), 350);
    return () => clearTimeout(t);
  }, [busca]);

  return (
    <div className="filtros">
      <div className="filtro-busca">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className="campo"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por beat ou produtor"
          aria-label="Buscar por beat ou produtor"
        />
      </div>

      <div className="filtro-linha">
        <label className="filtro-item">
          <span className="mini">Gênero</span>
          <select className="campo" value={valores.genero} onChange={(e) => aplicar('genero', e.target.value)}>
            <option value="">Todos</option>
            {opcoes.generos.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>

        <label className="filtro-item">
          <span className="mini">Mood</span>
          <select className="campo" value={valores.mood} onChange={(e) => aplicar('mood', e.target.value)}>
            <option value="">Todos</option>
            {opcoes.moods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <label className="filtro-item">
          <span className="mini">Tom</span>
          <select className="campo" value={valores.tom} onChange={(e) => aplicar('tom', e.target.value)}>
            <option value="">Todos</option>
            {opcoes.tons.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <div className="filtro-item filtro-bpm">
          <span className="mini">BPM</span>
          <div>
            <input
              className="campo" type="number" inputMode="numeric"
              placeholder={String(opcoes.bpmMin)} aria-label="BPM mínimo"
              defaultValue={valores.bpmMin}
              onBlur={(e) => aplicar('bpmMin', e.target.value)}
            />
            <span className="mini">até</span>
            <input
              className="campo" type="number" inputMode="numeric"
              placeholder={String(opcoes.bpmMax)} aria-label="BPM máximo"
              defaultValue={valores.bpmMax}
              onBlur={(e) => aplicar('bpmMax', e.target.value)}
            />
          </div>
        </div>

        <label className="filtro-item filtro-ordem">
          <span className="mini">Ordenar por</span>
          <select className="campo" value={valores.ordem} onChange={(e) => aplicar('ordem', e.target.value)}>
            {Object.entries(ordens).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
