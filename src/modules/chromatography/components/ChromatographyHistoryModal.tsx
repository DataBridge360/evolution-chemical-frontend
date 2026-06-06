'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, History, X } from 'lucide-react';

import { Calendar, formatInputDate, type RangeValue } from '@/src/components/ui/calendar';
import { downloadChromatographyHistory } from '@/src/modules/chromatography/services/chromatographyService';
import { Company } from '@/src/types/company';

type HistoryMode = 'dates' | 'all';

interface ChromatographyHistoryModalProps {
  isOpen: boolean;
  companies?: Company[];
  fixedCompanyId?: string;
  fixedCompanyName?: string;
  loadingCompanies?: boolean;
  onClose: () => void;
}

export function ChromatographyHistoryModal({
  isOpen,
  companies = [],
  fixedCompanyId,
  fixedCompanyName,
  loadingCompanies = false,
  onClose,
}: ChromatographyHistoryModalProps) {
  const [mode, setMode] = useState<HistoryMode>('dates');
  const [companyId, setCompanyId] = useState(fixedCompanyId || '');
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getTodayInputValue());
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedCompany = fixedCompanyId
    ? { company_id: fixedCompanyId, name: fixedCompanyName || 'empresa' }
    : companies.find((company) => company.company_id === companyId);

  const range = useMemo<RangeValue>(
    () => ({
      start: parseInputDateValue(dateFrom),
      end: parseInputDateValue(dateTo, true),
    }),
    [dateFrom, dateTo],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMode('dates');
    setCompanyId(fixedCompanyId || '');
    setDateFrom(getDefaultDateFrom());
    setDateTo(getTodayInputValue());
    setError(null);
  }, [fixedCompanyId, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleGenerateHistory = async () => {
    const targetCompanyId = fixedCompanyId || companyId;

    if (!targetCompanyId) {
      setError('Seleccione una empresa para generar el historial');
      return;
    }

    if (mode === 'dates') {
      if (!dateFrom || !dateTo) {
        setError('Seleccione fecha desde y fecha hasta');
        return;
      }

      if (dateFrom > dateTo) {
        setError('La fecha desde no puede ser posterior a la fecha hasta');
        return;
      }
    }

    setError(null);
    setIsDownloading(true);

    try {
      const blob = await downloadChromatographyHistory({
        companyId: targetCompanyId,
        dateFrom: mode === 'dates' ? dateFrom : undefined,
        dateTo: mode === 'dates' ? dateTo : undefined,
      });
      const suffix = mode === 'dates' ? `${dateFrom}_${dateTo}` : 'historico';
      downloadBlob(
        blob,
        `historial_cromatografia_${sanitizeFilename(selectedCompany?.name || 'empresa')}_${suffix}.xlsx`,
      );
      onClose();
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Error descargando historial de cromatografía',
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chromatography-history-title"
    >
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="chromatography-history-title" className="text-lg font-semibold text-gray-900">
              Generar historial
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Elija el alcance del Excel de cromatografía.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {!fixedCompanyId && (
            <label className="block space-y-1.5 text-sm font-medium text-gray-700">
              <span>Empresa</span>
              <select
                value={companyId}
                onChange={(event) => {
                  setCompanyId(event.target.value);
                  setError(null);
                }}
                disabled={loadingCompanies || isDownloading}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
              >
                <option value="">Seleccionar empresa</option>
                {companies.map((company) => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {fixedCompanyId && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="text-xs font-medium uppercase text-gray-500">Empresa</div>
              <div className="mt-0.5 text-sm font-semibold text-gray-900">
                {fixedCompanyName || 'Empresa seleccionada'}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('dates');
                setError(null);
              }}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors ${
                mode === 'dates'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Fechas
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('all');
                setError(null);
              }}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors ${
                mode === 'all'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              }`}
            >
              <History className="h-4 w-4" />
              Histórico
            </button>
          </div>

          {mode === 'dates' ? (
            <div className="rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
              <Calendar
                id="chromatography-history-modal-dates"
                label="Rango de fechas"
                value={range}
                showTimeInput={false}
                allowClear
                popoverPlacement="top"
                popoverAlignment="start"
                onChange={(value) => {
                  setDateFrom(value?.start ? formatInputDate(value.start) : '');
                  setDateTo(value?.end ? formatInputDate(value.end) : '');
                  setError(null);
                }}
                disabled={isDownloading}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Se descargará el historial completo de cromatografía para la empresa seleccionada.
            </div>
          )}

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerateHistory}
            disabled={isDownloading || loadingCompanies}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Generando...' : 'Generar historial'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getTodayInputValue() {
  return formatInputDate(new Date());
}

function getDefaultDateFrom() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return formatInputDate(date);
}

function parseInputDateValue(value: string, useEndOfDay = false) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (useEndOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function sanitizeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
