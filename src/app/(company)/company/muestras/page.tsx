'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { samplesService } from '@/src/modules/samples/services/SamplesService';
import { resultsService } from '@/src/modules/results/services/ResultsService';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Sample, SampleStatus } from '@/src/types/sample';
import { SampleResult } from '@/src/types/sampleResult';
import { formatDateAR } from '@/src/lib/dateUtils';

export default function CompanyMuestrasPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<SampleResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [canViewResults, setCanViewResults] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadSamples(1);
  }, []);

  const loadSamples = async (page: number) => {
    try {
      setLoading(true);
      const response = await samplesService.getAllSamplesPaginated(page, pagination.limit);

      setSamples(response?.data || []);
      setPagination({
        page: response?.page || 1,
        limit: response?.limit || 50,
        total: response?.total || 0,
        totalPages: response?.totalPages || 0,
      });

      // Si hay muestras, verificar el permiso de la compañía
      if (response?.data && response.data.length > 0) {
        const companyId = response.data[0].company_id;
        const company = await companiesService.getCompanyById(companyId);
        setCanViewResults(company.can_view_results);
      }
    } catch (error) {
      console.error('Error al cargar muestras:', error);
      setSamples([]);
      setPagination({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadSamples(newPage);
    }
  };

  const handleViewResult = async (sample: Sample) => {
    try {
      const result = await resultsService.getResultBySampleId(sample.sample_id);
      if (result) {
        setSelectedResult(result);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error('Error al cargar resultado:', error);
      alert('Error al cargar el resultado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando muestras...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de resultado */}
      {showResultModal && selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Resultados del Análisis</h2>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Fecha de Análisis:</p>
                <p className="text-gray-900">{formatDateAR(selectedResult.analysis_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Resultados:</p>
                <p className="whitespace-pre-wrap text-gray-900">
                  {selectedResult.analysis_performed}
                </p>
              </div>
              {selectedResult.observations && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Observaciones:</p>
                  <p className="whitespace-pre-wrap text-gray-900">{selectedResult.observations}</p>
                </div>
              )}
              <div className="pt-4">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="border border-gray-900 px-6 py-2 font-medium text-gray-900 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Muestras</h1>
          <button
            onClick={() => router.push('/company/muestras/nueva')}
            className="bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Nueva Muestra
          </button>
        </div>

        <div className="border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Análisis Requerido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Resultados
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {!samples || samples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay muestras registradas. Haz clic en &ldquo;Nueva Muestra&rdquo; para
                    comenzar.
                  </td>
                </tr>
              ) : (
                samples.map((sample) => (
                  <tr key={sample.sample_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {sample.internal_code || 'Pendiente'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sample.sample_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateAR(sample.sample_date)}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-900">
                      {sample.requested_analysis}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex border px-2 py-1 text-xs font-medium ${
                          sample.status === SampleStatus.LISTO
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {sample.status === SampleStatus.LISTO ? 'Listo' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sample.status === SampleStatus.LISTO ? (
                        canViewResults ? (
                          <button
                            onClick={() => handleViewResult(sample)}
                            className="bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                          >
                            Ver Resultados
                          </button>
                        ) : (
                          <div className="text-center">
                            <span className="block text-xs font-medium text-orange-600">
                              Sin permiso
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              Contactar laboratorio
                            </span>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">En proceso</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border border-gray-200 bg-white px-6 py-3">
            <div className="text-sm text-gray-600">
              Mostrando{' '}
              {samples && samples.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}{' '}
              muestras
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`border px-4 py-2 text-sm font-medium transition-colors ${
                  pagination.page === 1
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <div className="flex items-center px-4 py-2 text-sm text-gray-700">
                Página {pagination.page} de {pagination.totalPages}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`border px-4 py-2 text-sm font-medium transition-colors ${
                  pagination.page === pagination.totalPages
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
