'use client';

import { useRouter } from 'next/navigation';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';

const localidades = [
  { id: Localidad.CUTRAL_CO, name: LOCALIDAD_LABELS[Localidad.CUTRAL_CO] },
  { id: Localidad.RINCON, name: LOCALIDAD_LABELS[Localidad.RINCON] },
];

export default function AnalisisPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">Análisis</h1>
        <p className="mt-1 text-sm text-[#737373]">Análisis organizados por localidad</p>
      </div>

      <div className="flex flex-wrap gap-8">
        {localidades.map((loc) => (
          <button
            key={loc.id}
            onClick={() => router.push(`/analisis/${loc.id}`)}
            className="group flex w-28 flex-col items-center gap-2 text-center"
          >
            <svg
              className="h-20 w-20 drop-shadow-sm transition-transform group-hover:-translate-y-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ color: '#42a5f5' }}
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="text-xs font-medium text-[#525252] group-hover:text-[#0a0a0a]">
              {loc.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
