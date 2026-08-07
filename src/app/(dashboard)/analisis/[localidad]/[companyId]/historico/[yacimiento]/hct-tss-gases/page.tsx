'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowDownUp, Download } from 'lucide-react';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';
import {
  useWaterHistoricList,
  usePatchWaterHistoric,
} from '@/src/modules/historics/water/hooks/useWaterHistoric';
import { downloadWaterHistoricExcel } from '@/src/modules/historics/water/services/waterHistoricService';
import {
  WATER_COLUMN_ORDER,
  WATER_COLUMN_HEADERS,
  METADATA_COLUMNS,
  FROZEN_WIDTH,
  TSS_HCT_COUNT,
  GASES_COUNT,
  OTROS_COUNT,
} from '@/src/modules/historics/water/constants';
import type { WaterHistoricRecord } from '@/src/modules/historics/water/types';
import {
  yacimientoSlugToApi,
  getYacimientoBySlug,
} from '@/src/modules/historics/yacimientoConstants';
import { formatDateAR } from '@/src/lib/dateUtils';

const PARAM_COL_W = 140;

interface EditingCell {
  recordId: string;
  field: string;
}

interface PendingEdit {
  recordId: string;
  field: string;
  value: string;
  originalValue: string;
}

export default function HistoricoHctTssGasesPage() {
  const router = useRouter();
  const params = useParams();
  const localidad = params.localidad as Localidad;
  const companyId = params.companyId as string;
  const yacimiento = params.yacimiento as string;
  const oilfieldApi = yacimientoSlugToApi(yacimiento);
  const yacimientoInfo = getYacimientoBySlug(yacimiento);

  const [companyName, setCompanyName] = useState('');
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editContextRef = useRef<{
    recordId: string;
    field: string;
    originalValue: string;
  } | null>(null);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: pagesData,
    isLoading: loadingRecords,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWaterHistoricList({
    company_id: companyId,
    oilfield: oilfieldApi,
    ordering: sortAsc ? 'sample_date' : '-sample_date',
  });

  const records = useMemo(() => pagesData?.pages.flatMap((page) => page.data) ?? [], [pagesData]);
  const totalRecords = pagesData?.pages[0]?.total ?? 0;

  const patchMutation = usePatchWaterHistoric();

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loadCompany = async () => {
    try {
      setLoadingCompany(true);
      const company = await companiesService.getCompanyById(companyId);
      setCompanyName(company.name);
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await downloadWaterHistoricExcel({
        company_id: companyId,
        oilfield: oilfieldApi,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico_hct_tss_gases_${oilfieldApi}_${companyName || 'export'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
    } finally {
      setDownloading(false);
    }
  };

  const formatCell = (record: WaterHistoricRecord, key: keyof WaterHistoricRecord) => {
    const value = record[key];
    if (value === null || value === undefined || value === '') return 'NR';
    if (key === 'sample_date' || key === 'report_date') {
      return value ? formatDateAR(value as string) : 'NR';
    }
    return String(value);
  };

  // ── Inline editing handlers ──

  const handleDoubleClick = useCallback(
    (recordId: string, field: string, currentValue: string | number | null) => {
      setEditingCell({ recordId, field });
      setEditValue(currentValue != null ? String(currentValue) : '');
      editContextRef.current = {
        recordId,
        field,
        originalValue: currentValue != null ? String(currentValue) : '',
      };
    },
    [],
  );

  const submitEdit = useCallback((currentInputValue: string) => {
    const ctx = editContextRef.current;
    if (!ctx) return;
    const trimmed = currentInputValue.trim();
    if (trimmed === ctx.originalValue) {
      setEditingCell(null);
      editContextRef.current = null;
      return;
    }
    setPendingEdit({
      recordId: ctx.recordId,
      field: ctx.field,
      value: trimmed,
      originalValue: ctx.originalValue,
    });
    setEditingCell(null);
    editContextRef.current = null;
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitEdit(editValue);
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        editContextRef.current = null;
      }
    },
    [editValue, submitEdit],
  );

  const handleBlur = useCallback(() => {
    submitEdit(editValue);
  }, [editValue, submitEdit]);

  const handleConfirmSave = useCallback(() => {
    if (!pendingEdit) return;
    const valueToSend = pendingEdit.value === '' ? null : pendingEdit.value;
    patchMutation.mutate(
      {
        id: pendingEdit.recordId,
        data: { [pendingEdit.field]: valueToSend } as Partial<WaterHistoricRecord>,
      },
      { onSettled: () => setPendingEdit(null) },
    );
  }, [pendingEdit, patchMutation]);

  const handleCancelSave = useCallback(() => {
    setPendingEdit(null);
  }, []);

  const loading = loadingCompany || loadingRecords;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const totalWidth = FROZEN_WIDTH + WATER_COLUMN_ORDER.length * PARAM_COL_W;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <button
          onClick={() => router.push(`/analisis/${localidad}/${companyId}/historico/${yacimiento}`)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Volver"
        >
          <svg
            className="h-5 w-5 text-gray-600"
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
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            <span>/</span>
            <button
              onClick={() => router.push(`/analisis/${localidad}/${companyId}/historico`)}
              className="hover:text-blue-600"
            >
              Historico
            </button>
            <span>/</span>
            <button
              onClick={() =>
                router.push(`/analisis/${localidad}/${companyId}/historico/${yacimiento}`)
              }
              className="hover:text-blue-600"
            >
              {yacimientoInfo?.label ?? yacimiento.toUpperCase()}
            </button>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Historico HcT + TSS, Gases y Residual -{' '}
            {yacimientoInfo?.label ?? yacimiento.toUpperCase()}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {companyName} &middot; {totalRecords} registro
            {totalRecords !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortAsc((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d7e5f4] bg-[#f8fbff] px-4 py-2 text-sm font-medium text-[#1768a7] transition-colors hover:bg-white"
            title={
              sortAsc
                ? 'Orden ascendente (mas antiguo primero)'
                : 'Orden descendente (mas reciente primero)'
            }
          >
            <ArrowDownUp className="h-4 w-4" />
            {sortAsc ? 'Mas antiguo' : 'Mas reciente'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || totalRecords === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d7e5f4] bg-[#f8fbff] px-4 py-2 text-sm font-medium text-[#1768a7] transition-colors hover:bg-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando...' : 'Descargar Excel'}
          </button>
        </div>
      </div>

      {/* Table */}
      {totalRecords === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d7e4f2] bg-[#fbfdff] px-5 py-12 text-center">
          <p className="text-sm font-semibold text-[#10243e]">No hay registros en este historico</p>
          <p className="mt-2 text-sm text-[#66788c]">
            Crea un informe de TSS+HcT o Gases Disueltos para agregar registros.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#bcc9d8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: totalWidth }}>
              <thead>
                <tr>
                  {METADATA_COLUMNS.map((col, i) => (
                    <th
                      key={col.key}
                      rowSpan={3}
                      className={`border border-[#bcc9d8] bg-[#fdf5e6] ${
                        i === METADATA_COLUMNS.length - 1 ? 'border-r-2 border-r-[#9aab6e]' : ''
                      }`}
                      style={{
                        width: col.w,
                        minWidth: col.w,
                        maxWidth: col.w,
                        padding: 0,
                        position: 'sticky',
                        left: col.left,
                        zIndex: 20,
                      }}
                    >
                      <div
                        className="flex items-center justify-center text-sm font-normal text-[#333]"
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          height: 200,
                          width: '100%',
                        }}
                      >
                        {col.label}
                      </div>
                    </th>
                  ))}
                  {/* Group headers row 1 */}
                  <th
                    colSpan={TSS_HCT_COUNT}
                    className="border border-[#bcc9d8] bg-[#e6e0ec] px-3 py-1.5 text-left text-sm font-bold text-[#333]"
                  >
                    TSS + HcT
                  </th>
                  <th
                    colSpan={GASES_COUNT}
                    className="border border-[#bcc9d8] bg-[#e6e6e6] px-3 py-1.5 text-left text-sm font-bold text-[#333]"
                  >
                    Gases Disueltos
                  </th>
                  <th colSpan={OTROS_COUNT} className="border border-[#bcc9d8] bg-[#e6e6e6]" />
                </tr>

                <tr>
                  <th
                    colSpan={TSS_HCT_COUNT}
                    className="border border-[#bcc9d8] bg-[#e6e0ec] px-3 py-1 text-left text-xs font-normal text-[#333]"
                  >
                    Solidos Suspendidos e Hidrocarburos Totales
                  </th>
                  <th
                    colSpan={GASES_COUNT}
                    className="border border-[#bcc9d8] bg-[#e6e6e6] px-3 py-1 text-left text-xs font-normal text-[#333]"
                  >
                    O2, CO2, H2S en agua
                  </th>
                  <th
                    colSpan={OTROS_COUNT}
                    className="border border-[#bcc9d8] bg-[#e6e6e6] px-3 py-1 text-left text-xs font-normal text-[#333]"
                  >
                    Otros
                  </th>
                </tr>

                <tr>
                  {WATER_COLUMN_ORDER.map((field, idx) => (
                    <th
                      key={field}
                      className={`border border-[#bcc9d8] bg-white px-2 py-2 text-center text-xs font-normal leading-snug text-[#333] ${
                        idx === TSS_HCT_COUNT - 1 ? 'border-r-2 border-r-[#999]' : ''
                      } ${
                        idx === TSS_HCT_COUNT + GASES_COUNT - 1 ? 'border-r-2 border-r-[#999]' : ''
                      }`}
                      style={{ minWidth: PARAM_COL_W, height: 60 }}
                    >
                      {WATER_COLUMN_HEADERS[field] || field}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {records.map((record, rowIdx) => {
                  const stripeBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]';
                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors hover:bg-[#eef5ff] ${stripeBg}`}
                    >
                      {METADATA_COLUMNS.map((col, i) => {
                        const cellBg = rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb';
                        return (
                          <td
                            key={col.key}
                            className={`border border-[#d5dde7] px-1.5 py-2 text-center text-[11px] text-[#333] ${
                              i === METADATA_COLUMNS.length - 1
                                ? 'border-r-2 border-r-[#9aab6e]'
                                : ''
                            }`}
                            style={{
                              width: col.w,
                              minWidth: col.w,
                              maxWidth: col.w,
                              position: 'sticky',
                              left: col.left,
                              zIndex: 10,
                              backgroundColor: cellBg,
                            }}
                          >
                            <span
                              className={
                                col.key === 'laboratory'
                                  ? 'block whitespace-normal leading-tight'
                                  : 'block truncate'
                              }
                            >
                              {formatCell(record, col.key)}
                            </span>
                          </td>
                        );
                      })}
                      {WATER_COLUMN_ORDER.map((field, idx) => {
                        const rawValue = record[field];
                        const display =
                          rawValue === null || rawValue === undefined || rawValue === ''
                            ? 'NR'
                            : String(rawValue);
                        const isEditing =
                          editingCell?.recordId === record.id && editingCell?.field === field;
                        const isObservations = field === 'observations';

                        return (
                          <td
                            key={field}
                            className={`border border-[#d5dde7] px-2 py-3 text-sm tabular-nums ${
                              isObservations ? 'text-left' : 'text-center'
                            } ${idx === TSS_HCT_COUNT - 1 ? 'border-r-2 border-r-[#999]' : ''} ${
                              idx === TSS_HCT_COUNT + GASES_COUNT - 1
                                ? 'border-r-2 border-r-[#999]'
                                : ''
                            } ${display === 'NR' ? 'text-[#aaa]' : 'text-[#333]'}`}
                            style={{ minWidth: PARAM_COL_W }}
                            onDoubleClick={() =>
                              handleDoubleClick(
                                record.id,
                                field,
                                rawValue as string | number | null,
                              )
                            }
                          >
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                onBlur={handleBlur}
                                className="w-full rounded border border-[#1768a7] bg-white px-1 py-0.5 text-center text-sm text-[#333] outline-none"
                              />
                            ) : (
                              <span className="cursor-default">{display}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-[#1768a7] border-r-transparent" />
              <span className="ml-2 text-xs text-muted-foreground">Cargando mas registros...</span>
            </div>
          )}
        </div>
      )}

      {/* Confirm save modal */}
      {pendingEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-80 rounded-xl border border-[#d7e5f4] bg-white p-5 shadow-lg">
            <p className="text-sm font-medium text-[#10243e]">Deseas guardar los cambios?</p>
            <p className="mt-2 text-xs text-[#66788c]">
              {WATER_COLUMN_HEADERS[pendingEdit.field] || pendingEdit.field}:{' '}
              <span className="text-[#aaa]">{pendingEdit.originalValue || 'NR'}</span>
              {' \u2192 '}
              <span className="font-medium text-[#333]">{pendingEdit.value || 'NR'}</span>
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={handleCancelSave}
                className="rounded-lg border border-[#d5dde7] px-4 py-1.5 text-sm text-[#66788c] transition-colors hover:bg-gray-50"
              >
                No
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={patchMutation.isPending}
                className="rounded-lg bg-[#1768a7] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#125a8f] disabled:opacity-50"
              >
                {patchMutation.isPending ? 'Guardando...' : 'Si'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
