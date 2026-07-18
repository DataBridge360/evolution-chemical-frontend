'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Loader2, X } from 'lucide-react';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';
import {
  useEnvironmentReports,
  useDownloadExcel,
  useUpdateEnvironmentReport,
} from '@/src/modules/informes/medio-ambiente/hooks';
import { ALL_PARAMETERS } from '@/src/modules/informes/medio-ambiente/constants';
import { ReportPreview } from '@/src/modules/informes/medio-ambiente/components/ReportPreview';
import { parseReportForPreview } from '@/src/modules/informes/medio-ambiente/utils';
import type { EnvironmentReportRecord } from '@/src/modules/informes/medio-ambiente/types';
import { ToastContainer, toast } from '@/src/components/ui/Toast';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ReportDrawer({
  report,
  onClose,
  onReportUpdated,
}: {
  report: EnvironmentReportRecord;
  onClose: () => void;
  onReportUpdated: (updated: EnvironmentReportRecord) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const excelMutation = useDownloadExcel();
  const updateMutation = useUpdateEnvironmentReport();
  const [isEditing, setIsEditing] = useState(false);
  const [localReport, setLocalReport] = useState(report);

  const previewData = useMemo(() => parseReportForPreview(localReport), [localReport]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const buildParamPayload = (
    fieldName: string,
    newValue: string,
    type: 'value' | 'unit' | 'method',
  ) => {
    // Get current stored JSON for this param
    const raw = localReport[fieldName as keyof EnvironmentReportRecord] as string | undefined;
    let current = { value: '', unit: '', method: '' };

    if (raw) {
      const text = String(raw).trim();
      if (text.startsWith('{')) {
        try {
          current = JSON.parse(text);
        } catch {
          /* keep defaults */
        }
      } else {
        // Find default unit/method from constants
        const paramDef = ALL_PARAMETERS.find((p) => p.fieldName === fieldName);
        current = { value: text, unit: paramDef?.unit || '', method: paramDef?.method || '' };
      }
    } else {
      const paramDef = ALL_PARAMETERS.find((p) => p.fieldName === fieldName);
      current = { value: '', unit: paramDef?.unit || '', method: paramDef?.method || '' };
    }

    current[type] = newValue;
    return JSON.stringify(current);
  };

  const handleFieldChange = (
    fieldName: string,
    newValue: string,
    type: 'value' | 'unit' | 'method',
  ) => {
    const serialized = buildParamPayload(fieldName, newValue, type);

    // Update local state immediately
    setLocalReport((prev) => ({ ...prev, [fieldName]: serialized }) as EnvironmentReportRecord);

    // Persist to backend
    updateMutation.mutate(
      { reportId: report.id, data: { [fieldName]: serialized } },
      {
        onSuccess: (updated) => onReportUpdated(updated),
        onError: () => toast.error('Error al guardar el cambio.'),
      },
    );
  };

  const handleMetaChange = (fieldName: string, newValue: string) => {
    // Update local state immediately
    setLocalReport((prev) => ({ ...prev, [fieldName]: newValue }) as EnvironmentReportRecord);

    // Persist to backend
    updateMutation.mutate(
      { reportId: report.id, data: { [fieldName]: newValue } },
      {
        onSuccess: (updated) => onReportUpdated(updated),
        onError: () => toast.error('Error al guardar el cambio.'),
      },
    );
  };

  const onDownloadExcel = () => {
    const oilfield = localReport.oilfield || 'informe';
    const reportNum = localReport.report_number || 'sin-numero';
    excelMutation.mutate(
      {
        reportId: report.id,
        filename: `informe_medio_ambiente_${oilfield}_${reportNum}.xlsx`,
      },
      {
        onError: () => toast.error('Error al descargar el Excel.'),
      },
    );
  };

  const onDownloadPDF = () => {
    const element = document.getElementById('report-preview');
    if (!element) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Permití ventanas emergentes para descargar el PDF.');
      return;
    }

    const reportNum = localReport.report_number || 'sin-numero';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Informe_MedioAmbiente_${reportNum}</title>
<style>
  @page { size: A4 portrait; margin: 10mm 15mm; }
  body { margin: 0; padding: 0; background: white !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  img { display: inline-block; }
</style>
</head>
<body>
  ${element.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 100); }, 500);
    };
  <\/script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] bg-black/30"
      onClick={handleOverlayClick}
    >
      <div className="animate-in slide-in-from-right absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-[#e5e5e5] bg-white shadow-xl shadow-black/5 duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0a0a0a]">
              Informe N° {localReport.report_number || '—'}
            </h2>
            <p className="text-xs text-[#a3a3a3]">
              {formatDate(localReport.report_date)} · {localReport.oilfield || ''} ·{' '}
              {localReport.plant || ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Editar */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isEditing
                  ? 'bg-[#006096] text-white hover:bg-[#004d7a]'
                  : 'border border-[#e5e5e5] text-[#0a0a0a] hover:bg-[#f5f5f5]'
              }`}
            >
              {isEditing ? 'Editando' : 'Editar'}
            </button>
            {/* Excel */}
            <button
              type="button"
              onClick={onDownloadExcel}
              disabled={excelMutation.isPending}
              className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {excelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <img src="/informes/excel2-svgrepo-com.svg" alt="Excel" className="h-4 w-4" />
              )}
              Excel
            </button>
            {/* PDF */}
            <button
              type="button"
              onClick={onDownloadPDF}
              className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
            >
              <img src="/informes/pdf-file-svgrepo-com.svg" alt="PDF" className="h-4 w-4" />
              PDF
            </button>
            {/* Cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Edit mode indicator */}
        {isEditing && (
          <div className="border-b border-[#e5e5e5] bg-[#eef6ff] px-5 py-2">
            <p className="text-xs text-[#006096]">
              Modo edición activo — hacé click en cualquier celda para modificarla. Los cambios se
              guardan automaticamente.
            </p>
          </div>
        )}

        {/* Drawer Content — scrollable preview */}
        <div className="flex-1 overflow-y-auto bg-[#f5f5f5] p-5">
          <div className="mx-auto w-[595px] rounded-sm border border-[#e5e5e5] bg-white shadow-sm">
            <ReportPreview
              data={previewData}
              editable={isEditing}
              onFieldChange={handleFieldChange}
              onMetaChange={handleMetaChange}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function InformesMedioAmbientePage() {
  const router = useRouter();
  const params = useParams();
  const localidad = params.localidad as Localidad;
  const companyId = params.companyId as string;

  const [companyName, setCompanyName] = useState('');
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EnvironmentReportRecord | null>(null);

  const { data: reports = [], isLoading: loadingReports } = useEnvironmentReports(companyId);

  useEffect(() => {
    companiesService
      .getCompanyById(companyId)
      .then((c) => setCompanyName(c.name))
      .catch(() => {})
      .finally(() => setLoadingCompany(false));
  }, [companyId]);

  if (loadingCompany || loadingReports) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#006096] border-t-transparent" />
        <span className="ml-2.5 text-xs text-[#a3a3a3]">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/analisis/${localidad}/${companyId}`)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252]"
          title="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs text-[#a3a3a3]">
            <button onClick={() => router.push('/analisis')} className="hover:text-[#006096]">
              Análisis
            </button>
            <span className="mx-1.5">/</span>
            <button
              onClick={() => router.push(`/analisis/${localidad}`)}
              className="hover:text-[#006096]"
            >
              {LOCALIDAD_LABELS[localidad]}
            </button>
            <span className="mx-1.5">/</span>
            <button
              onClick={() => router.push(`/analisis/${localidad}/${companyId}`)}
              className="hover:text-[#006096]"
            >
              {companyName}
            </button>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
            Informes Medio Ambiente
          </h1>
          <p className="mt-0.5 text-sm text-[#737373]">
            {reports.length} {reports.length === 1 ? 'informe' : 'informes'}
          </p>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-[#d4d4d4]" />
          <p className="text-sm font-medium text-[#525252]">Sin informes</p>
          <p className="mt-1 text-xs text-[#a3a3a3]">
            No hay informes de medio ambiente para esta empresa.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-left text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
                <th className="px-5 py-3">N° Informe</th>
                <th className="px-5 py-3">Fecha Informe</th>
                <th className="px-5 py-3">Yacimiento</th>
                <th className="px-5 py-3">Planta</th>
                <th className="px-5 py-3">Equipo</th>
                <th className="px-5 py-3">Procedencia</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="cursor-pointer border-b border-[#f5f5f5] text-[#525252] transition-colors last:border-b-0 hover:bg-[#f9fafb]"
                >
                  <td className="px-5 py-3.5 text-xs font-medium text-[#0a0a0a]">
                    {report.report_number || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs">{formatDate(report.report_date)}</td>
                  <td className="px-5 py-3.5 text-xs">{report.oilfield || '—'}</td>
                  <td className="px-5 py-3.5 text-xs">{report.plant || '—'}</td>
                  <td className="px-5 py-3.5 text-xs">{report.equipment || '—'}</td>
                  <td className="px-5 py-3.5 text-xs">{report.origin || '—'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs font-medium text-[#006096]">Ver informe</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Drawer (panel lateral con preview) ─────────────────── */}
      {selectedReport && (
        <ReportDrawer
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onReportUpdated={(updated) => setSelectedReport(updated)}
        />
      )}

      <ToastContainer />
    </div>
  );
}
