'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';

export default function HistoricoPage() {
  const router = useRouter();
  const params = useParams();
  const localidad = params.localidad as Localidad;
  const companyId = params.companyId as string;

  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const company = await companiesService.getCompanyById(companyId);
      setCompanyName(company.name);
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const historicTypes = [
    {
      id: 'fq-tipo-a',
      name: 'FQ Tipo A',
      description: 'Fisicoquimico de agua Tipo A',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <button
          onClick={() => router.push(`/analisis/${localidad}/${companyId}`)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Volver"
        >
          <svg
            className="h-6 w-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => router.push('/analisis')} className="hover:text-blue-600">
              Analisis
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/analisis/${localidad}`)}
              className="hover:text-blue-600"
            >
              {LOCALIDAD_LABELS[localidad]}
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/analisis/${localidad}/${companyId}`)}
              className="hover:text-blue-600"
            >
              {companyName}
            </button>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Historico</h1>
          <p className="mt-1 text-sm text-muted-foreground">Selecciona un tipo de historico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {historicTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => router.push(`/analisis/${localidad}/${companyId}/historico/${type.id}`)}
            className="group border-2 border-border bg-white p-6 text-left transition-all hover:border-green-600 hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <svg
                className="h-12 w-12 flex-shrink-0 text-green-600 group-hover:text-green-700"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 truncate text-lg font-semibold text-foreground">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              <svg
                className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-green-600"
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
