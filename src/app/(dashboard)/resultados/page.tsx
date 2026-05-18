'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resultsService } from '@/src/modules/results/services/ResultsService';
import { SampleResultWithDetails } from '@/src/types/sampleResult';

export default function ResultadosPage() {
  const router = useRouter();
  const [results, setResults] = useState<SampleResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await resultsService.getAllResults();
      setResults(data);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar resultados por empresa
  const groupedByCompany = results.reduce(
    (acc, result) => {
      // El backend devuelve company_id y company_name directamente en el result
      const companyId = result.company_id || 'sin-empresa';
      const companyName = result.company_name || 'Sin empresa';

      if (!acc[companyId]) {
        acc[companyId] = {
          name: companyName,
          results: [],
        };
      }
      acc[companyId].results.push(result);
      return acc;
    },
    {} as Record<string, { name: string; results: SampleResultWithDetails[] }>,
  );

  const companies = Object.entries(groupedByCompany);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Resultados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resultados de análisis organizados por empresa
          </p>
        </div>
      </div>

      {/* Carpetas por empresa */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.length === 0 ? (
          <div className="col-span-full border border-border bg-white p-12 text-center text-muted-foreground">
            No hay resultados registrados.
          </div>
        ) : (
          companies.map(([companyId, company]) => (
            <button
              key={companyId}
              onClick={() => router.push(`/resultados/${companyId}`)}
              className="group border-2 border-border bg-white p-6 text-left transition-all hover:border-blue-600 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <svg
                  className="h-12 w-12 flex-shrink-0 text-yellow-600 group-hover:text-yellow-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 truncate text-lg font-semibold text-foreground">
                    {company.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {company.results.length} resultado{company.results.length !== 1 ? 's' : ''}
                  </p>
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
          ))
        )}
      </div>
    </div>
  );
}
