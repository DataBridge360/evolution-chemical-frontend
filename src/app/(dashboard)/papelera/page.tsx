'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Trash2 } from 'lucide-react';

import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import PasswordConfirmDialog from '@/src/components/ui/PasswordConfirmDialog';
import { ToastContainer, toast } from '@/src/components/ui/Toast';
import { samplesService } from '@/src/modules/samples/services/SamplesService';
import {
  listTrashAnalyses,
  restoreAnalysis,
  permanentDeleteAnalysis,
} from '@/src/modules/chromatography/services/chromatographyService';
import { formatDateAR } from '@/src/lib/dateUtils';

const EXPIRY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type TrashType = 'sample' | 'chromatography';

interface TrashRow {
  id: string;
  type: TrashType;
  typeLabel: string;
  label: string;
  sublabel: string;
  deletedAt: string | null;
  deletedByName: string | null;
}

/** Días restantes hasta la eliminación automática (puede ser <= 0). */
function daysLeft(deletedAt: string | null): number | null {
  if (!deletedAt) return null;
  const purgeAt = new Date(deletedAt).getTime() + EXPIRY_DAYS * DAY_MS;
  return Math.ceil((purgeAt - Date.now()) / DAY_MS);
}

function ExpiryBadge({ deletedAt }: { deletedAt: string | null }) {
  const days = daysLeft(deletedAt);
  if (days === null) return <span className="text-muted-foreground">—</span>;

  const label = days <= 0 ? 'Hoy' : days === 1 ? 'En 1 día' : `En ${days} días`;
  const urgent = days <= 2;

  return (
    <span
      className={`inline-flex border px-2 py-1 text-xs font-medium ${
        urgent
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-yellow-200 bg-yellow-50 text-yellow-700'
      }`}
    >
      {label}
    </span>
  );
}

export default function PapeleraPage() {
  const queryClient = useQueryClient();

  const samplesQuery = useQuery({
    queryKey: ['trash', 'samples'],
    queryFn: () => samplesService.getTrash(),
    staleTime: 60 * 1000,
  });

  const chromaQuery = useQuery({
    queryKey: ['trash', 'chromatography'],
    queryFn: () => listTrashAnalyses(),
    staleTime: 60 * 1000,
  });

  const [restoreTarget, setRestoreTarget] = useState<TrashRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrashRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const rows = useMemo<TrashRow[]>(() => {
    const sampleRows: TrashRow[] = (samplesQuery.data || []).map((s) => ({
      id: s.sample_id,
      type: 'sample',
      typeLabel: 'Muestra',
      label: s.internal_code || 'Sin código',
      sublabel: s.company_name || '',
      deletedAt: s.deleted_at ?? null,
      deletedByName: s.deleted_by_name ?? null,
    }));

    const chromaRows: TrashRow[] = (chromaQuery.data || []).map((a) => ({
      id: a.analysis_id,
      type: 'chromatography',
      typeLabel: 'Cromatografía',
      label: a.report_number ? `Informe ${a.report_number}` : a.company_name || 'Análisis',
      sublabel: [a.company_name, a.field_name, a.well_name].filter(Boolean).join(' · '),
      deletedAt: a.deleted_at,
      deletedByName: a.deleted_by_name,
    }));

    return [...sampleRows, ...chromaRows].sort(
      (a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime(),
    );
  }, [samplesQuery.data, chromaQuery.data]);

  const isLoading = samplesQuery.isLoading || chromaQuery.isLoading;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['trash'] });
    queryClient.invalidateQueries({ queryKey: ['samples'] });
    queryClient.invalidateQueries({ queryKey: ['analyses'] });
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setActionLoading(true);
    try {
      if (restoreTarget.type === 'sample') {
        await samplesService.restore(restoreTarget.id);
      } else {
        await restoreAnalysis(restoreTarget.id);
      }
      toast.success(`${restoreTarget.typeLabel} restaurada correctamente`);
      invalidateAll();
      setRestoreTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al restaurar');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (password: string) => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setPasswordError(null);
    try {
      if (deleteTarget.type === 'sample') {
        await samplesService.permanentDelete(deleteTarget.id, password);
      } else {
        await permanentDeleteAnalysis(deleteTarget.id, password);
      }
      toast.success(`${deleteTarget.typeLabel} eliminada permanentemente`);
      invalidateAll();
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      // El backend responde "Contraseña incorrecta" -> se muestra en el campo.
      setPasswordError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />

      <ConfirmDialog
        isOpen={restoreTarget !== null}
        title="Restaurar elemento"
        description={
          restoreTarget ? (
            <>
              ¿Restaurar <strong>{restoreTarget.label}</strong>? Volverá a su lugar original y
              dejará de estar en la papelera.
            </>
          ) : null
        }
        confirmLabel="Restaurar"
        loading={actionLoading}
        onConfirm={handleRestore}
        onClose={() => !actionLoading && setRestoreTarget(null)}
      />

      <PasswordConfirmDialog
        isOpen={deleteTarget !== null}
        title="Eliminar permanentemente"
        description={
          deleteTarget ? (
            <>
              Vas a eliminar <strong>{deleteTarget.label}</strong> de forma{' '}
              <strong>permanente e irreversible</strong>, sin esperar los 7 días. Confirmá con tu
              contraseña.
            </>
          ) : null
        }
        loading={actionLoading}
        error={passwordError}
        onConfirm={handlePermanentDelete}
        onClose={() => {
          if (!actionLoading) {
            setDeleteTarget(null);
            setPasswordError(null);
          }
        }}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Papelera</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Los elementos se eliminan automáticamente a los {EXPIRY_DAYS} días. Mientras tanto no
              aparecen en listados ni históricos.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando papelera...</p>
            </div>
          </div>
        ) : (
          <div className="border border-border bg-white">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Elemento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Eliminado el
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Se elimina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      La papelera está vacía.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={`${row.type}-${row.id}`} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground">
                          {row.typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-foreground">{row.label}</div>
                        {row.sublabel && (
                          <div className="text-xs text-muted-foreground">{row.sublabel}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {row.deletedAt ? formatDateAR(row.deletedAt) : '—'}
                        {row.deletedByName && (
                          <div className="text-xs text-muted-foreground">
                            por {row.deletedByName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <ExpiryBadge deletedAt={row.deletedAt} />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRestoreTarget(row)}
                            className="inline-flex items-center gap-1.5 border border-border bg-white px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restaurar
                          </button>
                          <button
                            onClick={() => {
                              setPasswordError(null);
                              setDeleteTarget(row);
                            }}
                            className="inline-flex items-center gap-1.5 bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
