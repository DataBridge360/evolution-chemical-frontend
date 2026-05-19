'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAnalysesByCompanyId } from '@/src/modules/chromatography/services/chromatographyService';
import { ChromatographicAnalysis } from '@/src/modules/chromatography/types';
import { formatDateAR } from '@/src/lib/dateUtils';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { AnalysisDetailPanel } from '@/src/modules/chromatography/components/AnalysisDetailPanel';

export default function CromaAnalysesPage() {
  const router = useRouter();
  const params = useParams();
  const localidad = params.localidad as Localidad;
  const companyId = params.companyId as string;

  const [analyses, setAnalyses] = useState<ChromatographicAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [company, analysesData] = await Promise.all([
        companiesService.getCompanyById(companyId),
        getAnalysesByCompanyId(companyId),
      ]);

      setCompanyName(company.name);
      setAnalyses(analysesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

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
              {analyses.length} análisis cromatográfico{analyses.length !== 1 ? 's' : ''}{' '}
              registrado{analyses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="border border-border bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Buscar análisis
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° informe, yacimiento, pozo..."
            className="w-full max-w-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Tabla de análisis */}
        <div className="overflow-hidden border border-border bg-white">
          {filteredAnalyses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {searchTerm
                ? 'No se encontraron análisis con ese criterio.'
                : 'No hay análisis cromatográficos para esta empresa.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      N° Informe
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Yacimiento
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Pozo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Fecha Análisis
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAnalyses.map((analysis) => (
                    <tr key={analysis.analysis_id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {analysis.report_number || 'Sin N°'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {analysis.field_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {analysis.well_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {analysis.analysis_date
                          ? formatDateAR(analysis.analysis_date)
                          : analysis.created_at
                            ? formatDateAR(analysis.created_at)
                            : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex border px-2 py-1 text-xs font-medium ${
                            analysis.status === 'reported' || analysis.status === 'approved'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : analysis.status === 'calculated'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {analysis.status === 'reported'
                            ? 'Informado'
                            : analysis.status === 'approved'
                              ? 'Aprobado'
                              : analysis.status === 'calculated'
                                ? 'Calculado'
                                : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedAnalysisId(analysis.analysis_id)}
                          className="bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Panel de Detalle (se abre al hacer click en "Ver Detalle") */}
      {selectedAnalysisId && (
        <AnalysisDetailPanel
          analysisId={selectedAnalysisId}
          onClose={() => setSelectedAnalysisId(null)}
        />
      )}
    </>
  );
}
