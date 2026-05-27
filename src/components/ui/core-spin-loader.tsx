'use client';

import { useEffect, useState } from 'react';

const loadingStates = [
  'Inicializando...',
  'Sincronizando...',
  'Procesando...',
  'Optimizando...',
  'Preparando portal...',
];

export function CoreSpinLoader() {
  const [loadingText, setLoadingText] = useState(loadingStates[0]);

  useEffect(() => {
    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % loadingStates.length;
      setLoadingText(loadingStates[index]);
    }, 900);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-8">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-400/10 shadow-[0_0_34px_rgba(14,165,233,0.25)]" />

        <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-dashed border-orange-500/35" />

        <div className="absolute inset-1 animate-[spin_2s_linear_infinite] rounded-full border-2 border-transparent border-t-orange-500 shadow-[0_0_9px_rgba(249,115,22,0.45)]" />

        <div className="absolute inset-3 animate-[spin_3s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]" />

        <div className="absolute inset-5 animate-[spin_1s_ease-in-out_infinite] rounded-full border border-transparent border-l-amber-300/70" />

        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_7px_rgba(34,211,238,0.85)]" />
        </div>

        <div className="absolute h-2 w-2 animate-pulse rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
      </div>

      <div className="flex h-8 flex-col items-center justify-center gap-1">
        <span
          key={loadingText}
          className="animate-in fade-in slide-in-from-bottom-2 text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500 duration-500"
        >
          {loadingText}
        </span>
      </div>
    </div>
  );
}
