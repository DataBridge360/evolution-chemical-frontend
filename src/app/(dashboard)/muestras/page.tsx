'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Sample, SampleStatus } from '@/src/types/sample';
import { LoadResultsModal } from '@/src/modules/samples/components/LoadResultsModal';
import { formatDateAR } from '@/src/lib/dateUtils';
import { useSamples, useInvalidateSamples } from '@/src/modules/samples/hooks/useSamples';
import { samplesService } from '@/src/modules/samples/services/SamplesService';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import { ToastContainer, toast } from '@/src/components/ui/Toast';

export default function MuestrasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [trashTarget, setTrashTarget] = useState<Sample | null>(null);
  const [trashLoading, setTrashLoading] = useState(false);

  // Usar React Query para obtener muestras con caché automático
  const { data, isLoading, error } = useSamples(currentPage, 50);
  const invalidateSamples = useInvalidateSamples();

  const handleMoveToTrash = async () => {
    if (!trashTarget) return;
    setTrashLoading(true);
    try {
      await samplesService.deleteSample(trashTarget.sample_id);
      toast.success('Muestra movida a la papelera');
      invalidateSamples();
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      setTrashTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al mover a la papelera');
    } finally {
      setTrashLoading(false);
    }
  };

  const samples = data?.data || [];
  const pagination = {
    page: data?.page || 1,
    limit: data?.limit || 50,
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewSample = (sample: Sample) => {
    if (sample.status === SampleStatus.LISTO) {
      // Redirigir al módulo de análisis de la empresa
      // NOTA: Necesita localidad de la empresa - por ahora vamos directo a croma
      router.push(`/analisis`);
    } else {
      // Abrir modal para cargar análisis
      setSelectedSample(sample);
      setShowResultsModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowResultsModal(false);
    setSelectedSample(null);
  };

  const handleSuccess = () => {
    // Invalidar caché para recargar datos
    invalidateSamples();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando muestras...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      <ConfirmDialog
        isOpen={trashTarget !== null}
        title="Mover a la papelera"
        description={
          trashTarget ? (
            <>
              ¿Mover la muestra <strong>{trashTarget.internal_code || 'sin código'}</strong> a la
              papelera? Dejará de aparecer en listados e históricos y se eliminará automáticamente a
              los 7 días. Podés restaurarla desde la papelera.
            </>
          ) : null
        }
        confirmLabel="Mover a la papelera"
        variant="danger"
        loading={trashLoading}
        onConfirm={handleMoveToTrash}
        onClose={() => !trashLoading && setTrashTarget(null)}
      />

      {showResultsModal && selectedSample && (
        <LoadResultsModal
          sample={selectedSample}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          isEditing={selectedSample.status === SampleStatus.LISTO}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Muestras</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestión de todas las muestras del laboratorio
            </p>
          </div>
        </div>

        <div className="border border-border bg-white">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {!samples || samples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No hay muestras registradas.
                  </td>
                </tr>
              ) : (
                samples.map((sample) => (
                  <tr key={sample.sample_id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {sample.internal_code || 'Pendiente'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {sample.company_name || sample.company_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{sample.sample_type}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {formatDateAR(sample.sample_date)}
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewSample(sample)}
                          className={`px-3 py-1 text-xs font-medium text-white transition-colors ${
                            sample.status === SampleStatus.LISTO
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {sample.status === SampleStatus.LISTO
                            ? 'Ver Análisis'
                            : 'Cargar Análisis'}
                        </button>
                        <button
                          onClick={() => setTrashTarget(sample)}
                          title="Mover a la papelera"
                          aria-label="Mover a la papelera"
                          className="inline-flex items-center justify-center border border-border bg-white p-1.5 text-muted-foreground transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border border-border bg-white px-6 py-3">
            <div className="text-sm text-muted-foreground">
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
                    ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                    : 'border-border bg-white text-foreground hover:bg-muted/50'
                }`}
              >
                Anterior
              </button>
              <div className="flex items-center px-4 py-2 text-sm text-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`border px-4 py-2 text-sm font-medium transition-colors ${
                  pagination.page === pagination.totalPages
                    ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                    : 'border-border bg-white text-foreground hover:bg-muted/50'
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
