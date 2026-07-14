'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';

const folders = [
  { id: 'croma', name: 'Cromatografía', color: '#4caf50' },
  { id: 'historico', name: 'Histórico', color: '#4caf50' },
];

export default function CompanyFoldersPage() {
  const router = useRouter();
  const params = useParams();
  const localidad = params.localidad as Localidad;
  const companyId = params.companyId as string;

  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companiesService
      .getCompanyById(companyId)
      .then((c) => setCompanyName(c.name))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#006096] border-t-transparent" />
        <span className="ml-2.5 text-xs text-[#a3a3a3]">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/analisis/${localidad}`)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252]"
          title="Volver a empresas"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs text-[#a3a3a3]">
            <button onClick={() => router.push('/analisis')} className="hover:text-[#006096]">
              Análisis
            </button>
            <span className="mx-1.5">/</span>
            <button
              onClick={() => router.push(`/analisis/${localidad}`)}
              className="hover:text-[#006096]"
            >
              {LOCALIDAD_LABELS[localidad]}
            </button>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">{companyName}</h1>
          <p className="mt-0.5 text-sm text-[#737373]">Seleccioná un tipo de análisis</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => router.push(`/analisis/${localidad}/${companyId}/${folder.id}`)}
            className="group flex w-28 flex-col items-center gap-2 text-center"
          >
            <svg
              className="h-20 w-20 drop-shadow-sm transition-transform group-hover:-translate-y-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ color: folder.color }}
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="text-xs font-medium text-[#525252] group-hover:text-[#0a0a0a]">
              {folder.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
