'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FlaskConical,
  HelpCircle,
  CalendarDays,
  FileEdit,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { cn } from '@/src/lib/utils';
import { formatDateTimeAR } from '@/src/lib/dateUtils';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { useDashboardStats } from '@/src/modules/chromatography/hooks/useDashboardStats';
import { useRecentHistory } from '@/src/modules/chromatography/hooks/useRecentHistory';
import {
  calculateProperties,
  deleteAnalysis,
  generateReport,
  uploadXLSXFile,
} from '@/src/modules/chromatography/services/chromatographyService';
import type { RecentHistoryItem } from '@/src/modules/chromatography/services/chromatographyService';
import { useAuth } from '@/src/modules/auth/hooks/useAuth/useAuth';
import { UserRole } from '@/src/types/user';
import type { Company } from '@/src/types/company';
import AnalysisLoadingModal from '@/src/modules/chromatography/components/AnalysisLoadingModal';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import { toast, ToastContainer } from '@/src/components/ui/Toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';

// ── Constants ────────────────────────────────────────────────────────────────

type ProcessStep = 'idle' | 'uploading' | 'calculating' | 'generating-report' | 'complete';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EXCEL_EXTENSIONS = ['.xlsx', '.xls'];
const ACCEPTED_FILE_TYPES =
  '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
const PAGE_SIZE = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function validateExcelFile(file: File) {
  const fileName = file.name.toLowerCase();
  if (!EXCEL_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
    return 'Solo se aceptan archivos Excel del cromatógrafo (.xlsx o .xls).';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'El Excel supera el máximo permitido de 10MB.';
  }
  return null;
}

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: 'Borrador', dot: 'bg-[#a3a3a3]', text: 'text-[#737373]' },
  calculated: { label: 'Calculado', dot: 'bg-[#006096]', text: 'text-[#006096]' },
  approved: { label: 'Aprobado', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  reported: { label: 'Informado', dot: 'bg-amber-500', text: 'text-amber-600' },
};

function getStatus(status: string) {
  return STATUS_MAP[status] ?? STATUS_MAP.draft;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChromatographyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: allCompanies = [], isLoading: loadingCompanies } = useCompanies();
  const { data: dashStats, isLoading: loadingStats } = useDashboardStats('7d');

  const companies = useMemo(() => {
    if (user?.role === UserRole.OWNER && user?.company_id) {
      return allCompanies.filter((c) => c.company_id !== user.company_id);
    }
    return allCompanies;
  }, [allCompanies, user]);

  // ── Form state ──────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  // ── Table state (backend-paginated) ───────────────────────────────────
  const [page, setPage] = useState(1);
  const { data: historyData, isLoading: loadingHistory } = useRecentHistory(page, PAGE_SIZE);
  const [trashTarget, setTrashTarget] = useState<RecentHistoryItem | null>(null);
  const [trashLoading, setTrashLoading] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    const s = companySearch.trim().toLowerCase();
    if (!s) return companies.slice(0, 8);
    return companies.filter((c) => c.name.toLowerCase().includes(s)).slice(0, 8);
  }, [companies, companySearch]);

  const pagedAnalyses = historyData?.results ?? [];
  const totalPages = historyData?.total_pages ?? 1;
  const totalItems = historyData?.total ?? 0;

  // ── Stats (from backend — accurate totals) ─────────────────────────────
  const totalCromas = dashStats?.total ?? 0;
  const totalMesActual = dashStats?.current_month ?? 0;
  const totalBorradores = dashStats?.drafts ?? 0;
  const prevMonth = dashStats?.previous_month ?? 0;
  const diffMesActual = totalMesActual - prevMonth;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCompanySelect = (company: Company) => {
    setSelectedCompanyId(company.company_id);
    setCompanySearch(company.name);
    setIsCompanyMenuOpen(false);
    companyInputRef.current?.blur();
    setError(null);
  };

  const handleFileSelect = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;
    const validationError = validateExcelFile(selected);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }
    setFile(selected);
    setError(null);
  };

  const clearForm = () => {
    setFile(null);
    setSelectedCompanyId('');
    setCompanySearch('');
    setFieldName('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Seleccioná un archivo Excel del cromatógrafo');
      return;
    }
    if (!selectedCompanyId) {
      setError('Seleccioná una empresa para asociar el análisis');
      return;
    }
    setError(null);

    try {
      setCurrentStep('uploading');
      const uploadResult = await uploadXLSXFile(file, {
        company_id: selectedCompanyId,
        field_name: fieldName,
      });

      setCurrentStep('calculating');
      await calculateProperties(uploadResult.analysis_id, {
        apply_o2_n2_discount: false,
        discount_percentage: 0,
        include_viscosities: false,
      });

      setCurrentStep('generating-report');
      await generateReport(uploadResult.analysis_id);

      setCurrentStep('complete');
      await queryClient.invalidateQueries({ queryKey: ['recent-history'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      setTimeout(() => {
        router.push(`/cromatografia/${uploadResult.analysis_id}`);
      }, 1000);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Error procesando análisis');
      setCurrentStep('idle');
    }
  };

  const handleMoveToTrash = async () => {
    if (!trashTarget) return;
    setTrashLoading(true);
    try {
      await deleteAnalysis(trashTarget.analysis_id);
      toast.success('Análisis movido a la papelera');
      queryClient.invalidateQueries({ queryKey: ['recent-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      setTrashTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al mover a la papelera');
    } finally {
      setTrashLoading(false);
    }
  };

  const isProcessing = currentStep !== 'idle';
  const canSubmit = Boolean(file && selectedCompanyId) && !isProcessing;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer />

      <div className="space-y-6 pb-10">
        {/* ── Title ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
            Carga cromatográfica
          </h1>
          <p className="mt-1 text-sm text-[#737373]">
            Subí el Excel del cromatógrafo, asociá la empresa y procesá el análisis.
          </p>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total cromatografías"
            icon={<FlaskConical className="h-4 w-4" />}
            value={totalCromas}
            loading={loadingStats}
            badge={`${totalMesActual} este mes`}
            badgePositive
          />
          <StatCard
            title="Mes actual"
            icon={<CalendarDays className="h-4 w-4" />}
            value={totalMesActual}
            loading={loadingStats}
            badge={
              diffMesActual === 0
                ? 'Sin cambios vs anterior'
                : `${Math.abs(diffMesActual)} vs mes anterior`
            }
            badgePositive={diffMesActual >= 0}
          />
          <StatCard
            title="Borradores"
            icon={<FileEdit className="h-4 w-4" />}
            value={totalBorradores}
            loading={loadingStats}
          />
        </div>

        {/* ── Upload form ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white">
          <div className="space-y-4 p-5">
            {/* Yacimiento + Empresa */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Yacimiento */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525252]">
                  Yacimiento <span className="text-[#a3a3a3]">(opcional)</span>
                </label>
                <input
                  value={fieldName}
                  disabled={isProcessing}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="Nombre del yacimiento"
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:border-[#006096] focus:outline-none focus:ring-1 focus:ring-[#006096]/20 disabled:opacity-50"
                />
              </div>

              {/* Empresa */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525252]">
                  Empresa <span className="text-[#006096]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#a3a3a3]">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    ref={companyInputRef}
                    value={companySearch}
                    disabled={isProcessing || loadingCompanies}
                    onFocus={() => setIsCompanyMenuOpen(true)}
                    onBlur={() => setTimeout(() => setIsCompanyMenuOpen(false), 150)}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setSelectedCompanyId('');
                      setIsCompanyMenuOpen(true);
                      setError(null);
                    }}
                    placeholder={loadingCompanies ? 'Cargando empresas...' : 'Buscar empresa'}
                    className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-white pl-9 pr-8 text-sm text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:border-[#006096] focus:outline-none focus:ring-1 focus:ring-[#006096]/20 disabled:opacity-50"
                    autoComplete="off"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#a3a3a3]">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>

                  {isCompanyMenuOpen && !isProcessing && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white shadow-lg shadow-black/5">
                      <div className="max-h-48 overflow-y-auto py-1">
                        {loadingCompanies ? (
                          <div className="px-3 py-2 text-xs text-[#a3a3a3]">Cargando...</div>
                        ) : filteredCompanies.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-[#a3a3a3]">
                            No se encontraron empresas.
                          </div>
                        ) : (
                          filteredCompanies.map((company) => {
                            const isSelected = company.company_id === selectedCompanyId;
                            return (
                              <button
                                key={company.company_id}
                                type="button"
                                className={cn(
                                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors',
                                  isSelected
                                    ? 'bg-[#f5f5f5] font-medium text-[#006096]'
                                    : 'text-[#525252] hover:bg-[#fafafa]',
                                )}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleCompanySelect(company);
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                      isSelected
                                        ? 'bg-[#006096]/10 text-[#006096]'
                                        : 'bg-[#f5f5f5] text-[#a3a3a3]',
                                    )}
                                  >
                                    <Building2 className="h-3 w-3" />
                                  </span>
                                  <span className="truncate">{company.name}</span>
                                </span>
                                {isSelected && <Check className="h-3 w-3 shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File upload area */}
            <div
              role="button"
              tabIndex={isProcessing ? -1 : 0}
              aria-disabled={isProcessing}
              style={
                !file && !error && !isDragging
                  ? { background: 'linear-gradient(135deg, #eef6ff 0%, #fff7ed 100%)' }
                  : isDragging
                    ? { background: 'linear-gradient(135deg, #dbeafe 0%, #ffedd5 100%)' }
                    : undefined
              }
              className={cn(
                'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
                file
                  ? 'border-[#e5e5e5] bg-white'
                  : 'border-[#c7d8ea] hover:border-[#99b5d4]',
                isDragging && 'border-[#006096]',
                isProcessing && 'cursor-not-allowed opacity-60',
                error && !file && 'border-red-300 bg-red-50/50',
              )}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isProcessing) setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (!isProcessing) handleFileSelect(e.dataTransfer.files);
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              {file ? (
                <>
                  <button
                    type="button"
                    aria-label="Quitar archivo"
                    disabled={isProcessing}
                    className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252] disabled:pointer-events-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearForm();
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex w-full max-w-md items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#006096]">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-[#0a0a0a]">{file.name}</p>
                      <p className="text-xs text-[#a3a3a3]">{Math.round(file.size / 1024)} KB</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      Listo
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f5]">
                    <Upload className="h-4 w-4 text-[#a3a3a3]" />
                  </div>
                  <p className="text-sm font-medium text-[#525252]">
                    Arrastrá el archivo o hacé clic para cargarlo
                  </p>
                  <p className="mt-0.5 text-xs text-[#a3a3a3]">
                    Se aceptan archivos Excel del cromatógrafo en formato{' '}
                    <span className="font-medium text-[#525252]">.xlsx</span> y{' '}
                    <span className="font-medium text-[#525252]">.xls</span>.
                  </p>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_FILE_TYPES}
                disabled={isProcessing}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#f0f0f0] px-5 py-3">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs text-[#a3a3a3] transition-colors hover:text-[#525252]"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    Formatos admitidos y tamaño máximo
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] border border-[#e5e5e5] bg-white py-2.5 text-[#0a0a0a] shadow-lg">
                  <p className="text-[10px] leading-4 text-[#737373]">
                    Solo se aceptan archivos Excel del cromatógrafo en formato XLSX o XLS. Tamaño
                    máximo: 10MB.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={clearForm}
                className="rounded-lg border border-[#e5e5e5] bg-white px-4 py-2 text-xs font-medium text-[#525252] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
              >
                Limpiar
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleUpload}
                className="rounded-lg bg-[#006096] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#004d7a] disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
              >
                Procesar análisis
              </button>
            </div>
          </div>
        </div>

        {/* ── History table ───────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white">
          <div className="border-b border-[#f0f0f0] px-5 py-4">
            <h2 className="text-base font-semibold text-[#0a0a0a]">Historial mensual</h2>
            <p className="mt-0.5 text-xs text-[#a3a3a3]">
              Cromatografías del último mes
            </p>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#006096] border-t-transparent" />
              <span className="ml-2.5 text-xs text-[#a3a3a3]">Cargando historial...</span>
            </div>
          ) : pagedAnalyses.length === 0 ? (
            <div className="py-12 text-center">
              <FlaskConical className="mx-auto h-8 w-8 text-[#e5e5e5]" />
              <p className="mt-2 text-sm text-[#a3a3a3]">No hay análisis del último mes</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#f0f0f0]">
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3]">
                        Empresa
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3]">
                        Yacimiento
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3]">
                        Estado
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3]">
                        Fecha y hora
                      </th>
                      <th className="w-10 px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAnalyses.map((analysis) => {
                      const s = getStatus(analysis.status);
                      return (
                        <tr
                          key={analysis.analysis_id}
                          onClick={() => router.push(`/cromatografia/${analysis.analysis_id}`)}
                          className="cursor-pointer border-b border-[#f5f5f5] transition-colors last:border-b-0 hover:bg-[#fafafa]"
                        >
                          <td className="px-5 py-3 font-medium text-[#0a0a0a]">
                            {analysis.company_name || 'Sin empresa'}
                          </td>
                          <td className="px-5 py-3 text-[#737373]">
                            {analysis.field_name || '—'}
                          </td>
                          <td className="px-5 py-3">
                            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', s.text)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-[#a3a3a3]">
                            {formatDateTimeAR(analysis.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrashTarget(analysis);
                              }}
                              title="Mover a la papelera"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#d4d4d4] transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#f0f0f0] px-5 py-3">
                  <p className="text-xs text-[#a3a3a3]">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} de{' '}
                    {totalItems}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#737373] transition-colors hover:bg-[#f5f5f5] disabled:text-[#e5e5e5] disabled:hover:bg-transparent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs text-[#737373]">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#737373] transition-colors hover:bg-[#f5f5f5] disabled:text-[#e5e5e5] disabled:hover:bg-transparent"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnalysisLoadingModal
        isOpen={isProcessing}
        currentStep={currentStep === 'idle' ? 'uploading' : currentStep}
      />

      <ConfirmDialog
        isOpen={trashTarget !== null}
        title="Mover a la papelera"
        description={
          trashTarget ? (
            <>
              ¿Mover el análisis de <strong>{trashTarget.company_name || 'sin empresa'}</strong> a
              la papelera? Se eliminará automáticamente a los 7 días. Podés restaurarlo desde la
              papelera.
            </>
          ) : null
        }
        confirmLabel="Mover a la papelera"
        variant="danger"
        loading={trashLoading}
        onConfirm={handleMoveToTrash}
        onClose={() => !trashLoading && setTrashTarget(null)}
      />
    </>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  icon,
  value,
  loading,
  badge,
  badgePositive,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  loading: boolean;
  badge?: string;
  badgePositive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[5px] rounded-lg border border-[var(--hairline,#e5e5e5)] bg-white px-5 py-[18px]">
      <div className="flex items-center gap-2">
        <span className="text-[var(--mute,#a3a3a3)]">{icon}</span>
        <p className="text-xs font-medium text-[var(--mute,#a3a3a3)]">{title}</p>
      </div>
      <div className="border-t border-[var(--hairline,#e5e5e5)]" />
      {loading ? (
        <div className="h-8 w-14 animate-pulse rounded bg-[var(--surface-softer,#f5f5f5)]" />
      ) : (
        <div className="flex items-end justify-between">
          <p className="text-3xl font-semibold tracking-tight text-[var(--ink,#0a0a0a)]">{value}</p>
          {badge && (
            <span
              className={cn(
                'mb-1 inline-flex items-center gap-0.5 text-xs font-medium',
                badgePositive ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {badgePositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
