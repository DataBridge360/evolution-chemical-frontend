'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';

export default function LocalidadEmpresasPage() {
  const router = useRouter();
  const params = useParams();
  const localidad = params.localidad as Localidad;

  const { data: allCompanies = [], isLoading: loading } = useCompanies();

  const companies = useMemo(
    () => allCompanies.filter((company) => company.localidad === localidad),
    [allCompanies, localidad],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#006096] border-t-transparent" />
        <span className="ml-2.5 text-xs text-[#a3a3a3]">Cargando empresas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/analisis')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252]"
          title="Volver a localidades"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
            {LOCALIDAD_LABELS[localidad]}
          </h1>
          <p className="mt-0.5 text-sm text-[#737373]">
            {companies.length} empresa{companies.length !== 1 ? 's' : ''} en esta localidad
          </p>
        </div>
      </div>

      {companies.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#a3a3a3]">
          No hay empresas en esta localidad
        </p>
      ) : (
        <div className="flex flex-wrap gap-8">
          {companies.map((company) => (
            <button
              key={company.company_id}
              onClick={() => router.push(`/analisis/${localidad}/${company.company_id}`)}
              className="group flex w-28 flex-col items-center gap-2 text-center"
            >
              <svg
                className="h-20 w-20 drop-shadow-sm transition-transform group-hover:-translate-y-1"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ color: '#fbbf24' }}
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="line-clamp-2 text-xs font-medium text-[#525252] group-hover:text-[#0a0a0a]">
                {company.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
