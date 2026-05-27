'use client';

import { useRouter } from 'next/navigation';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';

export default function AnalisisPage() {
  const router = useRouter();

  const localidades = [
    { id: Localidad.CUTRAL_CO, name: LOCALIDAD_LABELS[Localidad.CUTRAL_CO] },
    { id: Localidad.RINCON, name: LOCALIDAD_LABELS[Localidad.RINCON] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Análisis</h1>
          <p className="mt-1 text-sm text-muted-foreground">Análisis organizados por localidad</p>
        </div>
      </div>

      {/* Carpetas por localidad */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {localidades.map((localidad) => (
          <button
            key={localidad.id}
            onClick={() => router.push(`/analisis/${localidad.id}`)}
            className="group border-2 border-border bg-white p-6 text-left transition-all hover:border-blue-600 hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <svg
                className="h-12 w-12 flex-shrink-0 text-blue-600 group-hover:text-blue-700"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 truncate text-lg font-semibold text-foreground">
                  {localidad.name}
                </h3>
                <p className="text-sm text-muted-foreground">Ver empresas y análisis</p>
              </div>
              <svg
                className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
