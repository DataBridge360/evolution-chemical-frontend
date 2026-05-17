'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { resultsService } from '@/src/modules/results/services/ResultsService';
import { SampleResultWithDetails } from '@/src/types/sampleResult';
import { formatDateAR } from '@/src/lib/dateUtils';

export default function CompanyResultsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [results, setResults] = useState<SampleResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [selectedResult, setSelectedResult] = useState<SampleResultWithDetails | null>(null);
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    loadCompanyResults();
  }, [companyId]);

  const loadCompanyResults = async () => {
    // Validar que companyId sea un UUID válido ANTES de hacer el request
    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      console.error('ID de compañía inválido:', companyId);
      router.push('/resultados');
      return;
    }

    try {
      setLoading(true);
      const data = await resultsService.getResultsByCompany(companyId);
      setResults(data);
      if (data.length > 0) {
        // Usar campos directos del backend Django
        setCompanyName(data[0].company_name || 'Empresa');
      }
    } catch (error) {
      console.error('Error al cargar resultados de la empresa:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar resultados por código interno
  const filteredResults = results.filter((result) => {
    if (!searchCode) return true;
    // Usar campos directos del backend Django
    return result.internal_code?.toLowerCase().includes(searchCode.toLowerCase());
  });

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
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <button
          onClick={() => router.push('/resultados')}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Volver a resultados"
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
          <h1 className="text-2xl font-semibold text-foreground">{companyName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? 's' : ''} registrado
            {results.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtro por código */}
      <div className="border border-border bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Buscar por Código Interno
        </label>
        <input
          type="text"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          placeholder="Ej: EC-0001"
          className="w-full max-w-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Tabla de muestras */}
      <div className="overflow-hidden border border-border bg-white">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {searchCode
              ? 'No se encontraron resultados con ese código.'
              : 'No hay resultados para esta empresa.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Código Interno
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Tipo de Muestra
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Fecha de Muestra
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Fecha de Análisis
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResults.map((result) => (
                  <tr key={result.sample_result_id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {result.internal_code || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {result.sample_type || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {result.sample_date ? formatDateAR(result.sample_date) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {result.analysis_date ? formatDateAR(result.analysis_date.toString()) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedResult(result)}
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

      {/* Modal de detalle */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white">
            {/* Header del modal */}
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-white px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de Muestra - {selectedResult.internal_code}
              </h2>
              <button
                onClick={() => setSelectedResult(null)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="space-y-6 p-6">
              {/* Información de la Muestra */}
              <div className="border border-border p-4">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Información de la Muestra
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Código Interno</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResult.internal_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Muestra</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResult.sample_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Muestra</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResult.sample_date
                        ? formatDateAR(selectedResult.sample_date)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Empresa</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResult.company_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resultados del Análisis */}
              <div className="border border-border p-4">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Resultados del Análisis
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Fecha de Análisis</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResult.analysis_date
                        ? formatDateAR(selectedResult.analysis_date.toString())
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Análisis Realizado</p>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="whitespace-pre-wrap text-sm text-gray-900">
                        {selectedResult.analysis_performed}
                      </p>
                    </div>
                  </div>
                  {selectedResult.observations && (
                    <div>
                      <p className="mb-1 text-sm text-gray-500">Observaciones</p>
                      <div className="rounded border border-gray-200 bg-gray-50 p-3">
                        <p className="whitespace-pre-wrap text-sm text-gray-900">
                          {selectedResult.observations}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="sticky bottom-0 flex justify-end border-t border-border bg-gray-50 px-6 py-4">
              <button
                onClick={() => setSelectedResult(null)}
                className="bg-gray-600 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
