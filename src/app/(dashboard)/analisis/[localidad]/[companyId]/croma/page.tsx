'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAnalysesByCompany } from '@/src/modules/chromatography/hooks/useAnalysesByCompany';
import { useCompany } from '@/src/modules/companies/hooks/useCompany';
import { formatDateAR } from '@/src/lib/dateUtils';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';

export default function CromaAnalysesPage() {
  const router = useRouter();
  const params = useParams();
  const localidad = params.localidad as Localidad;
  const companyId = params.companyId as string;

  const [searchTerm, setSearchTerm] = useState('');

  // Usar hooks con cache
  const { data: company, isLoading: loadingCompany } = useCompany(companyId);
  const { data: analyses = [], isLoading: loadingAnalyses } = useAnalysesByCompany(companyId);

  const loading = loadingCompany || loadingAnalyses;
  const companyName = company?.name || '';

  // Filtrar análisis por término de búsqueda
  const filteredAnalyses = analyses.filter((analysis) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      analysis.report_number?.toLowerCase().includes(search) ||
      analysis.field_name?.toLowerCase().includes(search) ||
      analysis.well_name?.toLowerCase().includes(search) ||
      analysis.sample_point?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header con navegación */}
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <button
            onClick={() => router.push(`/analisis/${localidad}/${companyId}`)}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            title="Volver a tipos de análisis"
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
                Análisis
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
            <h1 className="text-2xl font-semibold text-foreground">Cromatografía</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {analyses.length} análisis cromatográfico{analyses.length !== 1 ? 's' : ''} registrado
              {analyses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="border border-border bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-900">Buscar análisis</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° informe, yacimiento, pozo..."
            className="w-full max-w-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Lista de análisis con diseño de tarjetas */}
        <div className="space-y-2">
          {filteredAnalyses.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-sm text-gray-600">
                {searchTerm
                  ? 'No se encontraron análisis con ese criterio.'
                  : 'No hay análisis cromatográficos para esta empresa.'}
              </p>
            </div>
          ) : (
            filteredAnalyses.map((analysis) => {
              const getStatusInfo = (status: string) => {
                const statusMap: Record<string, { label: string; color: string }> = {
                  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
                  calculated: { label: 'Calculado', color: 'bg-blue-100 text-blue-700' },
                  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
                  reported: { label: 'Informado', color: 'bg-green-100 text-green-700' },
                };
                return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
              };

              const statusInfo = getStatusInfo(analysis.status);
              const displayDate = analysis.analysis_date || analysis.created_at;

              return (
                <div
                  key={analysis.analysis_id}
                  onClick={() =>
                    router.push(`/analisis/${localidad}/${companyId}/croma/${analysis.analysis_id}`)
                  }
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">
                        {analysis.report_number
                          ? `Informe N° ${analysis.report_number}`
                          : companyName}
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
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
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
                          {analysis.well_name && ` - ${analysis.well_name}`}
                        </span>
                      )}
                      {displayDate && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDateAR(displayDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
