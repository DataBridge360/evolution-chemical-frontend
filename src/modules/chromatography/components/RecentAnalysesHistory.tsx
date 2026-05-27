'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysesList } from '../hooks/useAnalysesList';
import { formatDateAR } from '@/src/lib/dateUtils';

export default function RecentAnalysesHistory() {
  const router = useRouter();
  const { data: allAnalyses, isLoading: loading, error: queryError } = useAnalysesList();

  const error = queryError ? 'Error cargando historial' : null;

  // Filtrar y ordenar análisis del último mes
  const analyses = useMemo(() => {
    if (!allAnalyses) return [];

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return allAnalyses
      .filter((analysis) => new Date(analysis.created_at) >= oneMonthAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20); // Limitar a los últimos 20
  }, [allAnalyses]);

  const handleAnalysisClick = (analysisId: string) => {
    router.push(`/cromatografia/${analysisId}`);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
      calculated: { label: 'Calculado', color: 'bg-blue-100 text-blue-700' },
      approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="ml-3 text-sm text-gray-600">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  }

  if (analyses.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-600">No hay análisis recientes del último mes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {analyses.map((analysis) => {
        const statusInfo = getStatusLabel(analysis.status);
        return (
          <div
            key={analysis.analysis_id}
            onClick={() => handleAnalysisClick(analysis.analysis_id)}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-900">
                  {analysis.company_name || 'Sin empresa'}
                </h4>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                {analysis.field_name && (
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {analysis.field_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDateAR(analysis.created_at)}
                </span>
              </div>
            </div>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
