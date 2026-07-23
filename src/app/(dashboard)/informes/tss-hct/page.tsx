'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, History, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReportForm } from '@/src/modules/informes/tss-hct/components/ReportForm';
import { ReportPreview } from '@/src/modules/informes/tss-hct/components/ReportPreview';
import {
  tssHctReportSchema,
  type TssHctReportFormData,
} from '@/src/modules/informes/tss-hct/types';
import {
  EMPTY_SAMPLING_POINT,
  DEFAULT_ANALYSIS_TEXT,
} from '@/src/modules/informes/tss-hct/constants';
import { serializeTssHctForApi } from '@/src/modules/informes/tss-hct/utils';
import {
  useCreateTssHctReport,
  useDownloadTssHctExcel,
} from '@/src/modules/informes/tss-hct/hooks';
import type { Company } from '@/src/types/company';
import { ToastContainer, toast } from '@/src/components/ui/Toast';

export default function TssHctPage() {
  const router = useRouter();
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TssHctReportFormData>({
    resolver: zodResolver(tssHctReportSchema),
    defaultValues: {
      sample_description: 'Agua',
      extracted_by: 'Evolution Chemical SRL',
      requested_analysis: DEFAULT_ANALYSIS_TEXT,
      laboratory: 'Evolution Chemical',
      include_h2s: false,
      include_co2: false,
      sampling_points: [{ ...EMPTY_SAMPLING_POINT }],
    },
  });

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  const createMutation = useCreateTssHctReport();
  const excelMutation = useDownloadTssHctExcel();

  const formData = watch();

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setValue('company_id', company.company_id);
    setValue('localidad', company.localidad);
  };

  const onSave = handleSubmit(async (data) => {
    if (savedReportId) return;
    const payload = serializeTssHctForApi(data);
    try {
      const result = await createMutation.mutateAsync(payload);
      setSavedReportId(result.id);
      toast.success('Informe guardado correctamente.');
    } catch {
      toast.error('Error al guardar el informe. Intentá de nuevo.');
    }
  });

  const onDownloadExcel = () => {
    if (!savedReportId) return;
    const oilfield = formData.oilfield || 'informe';
    const reportNum = formData.report_number || 'sin-numero';
    excelMutation.mutate({
      reportId: savedReportId,
      filename: `informe_tss_hct_${oilfield}_${reportNum}.xlsx`,
    });
  };

  const onDownloadPDF = () => {
    const element = document.getElementById('report-preview');
    if (!element) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Permití ventanas emergentes para descargar el PDF.');
      return;
    }

    const reportNum = formData.report_number || 'sin-numero';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Informe_TSS_HcT_${reportNum}</title>
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

  const onViewHistoric = () => {
    const localidad = formData.localidad || selectedCompany?.localidad || '';
    const companyId = formData.company_id || '';
    router.push(
      `/analisis/${encodeURIComponent(localidad)}/${encodeURIComponent(companyId)}/informes-tss-hct`,
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/informes"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e5e5] text-[#525252] transition-colors hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[#0a0a0a]">Informe TSS + HcT</h1>
            <p className="text-xs text-[#a3a3a3]">
              {savedReportId
                ? 'Informe guardado — podés descargar Excel o PDF'
                : 'Completá los datos y visualizá el informe'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Guardar */}
          <button
            type="button"
            onClick={onSave}
            disabled={createMutation.isPending || !!savedReportId}
            className="flex items-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : savedReportId ? (
              <Check className="h-4 w-4" />
            ) : null}
            {savedReportId ? 'Guardado' : 'Guardar'}
          </button>

          {/* Excel */}
          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={!savedReportId || excelMutation.isPending}
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
            disabled={!savedReportId}
            className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <img src="/informes/pdf-file-svgrepo-com.svg" alt="PDF" className="h-4 w-4" />
            PDF
          </button>

          {/* Ver historial */}
          <button
            type="button"
            onClick={onViewHistoric}
            disabled={!savedReportId}
            className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <History className="h-4 w-4" />
            Ver historial
          </button>
        </div>
      </div>

      {/* ── Content: Form (left) + Preview (right) ────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Form */}
        <div className="w-[440px] shrink-0 overflow-y-auto border-r border-[#e5e5e5] p-5">
          <ReportForm
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
            control={control}
            selectedCompany={selectedCompany}
            onCompanySelect={handleCompanySelect}
          />
        </div>

        {/* Preview */}
        <div className="min-w-0 flex-1 overflow-auto bg-[#f5f5f5] p-6">
          <div className="mx-auto w-[595px] shrink-0 rounded-sm border border-[#e5e5e5] bg-white shadow-sm">
            <ReportPreview data={formData} />
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
