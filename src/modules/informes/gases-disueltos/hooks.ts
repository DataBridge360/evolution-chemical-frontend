import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGasesDisueltosReport,
  listGasesDisueltosReports,
  updateGasesDisueltosReport,
  downloadGasesDisueltosReportExcel,
  downloadGasesDisueltosReportPDF,
} from './services';

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

export function useGasesDisueltosReports(companyId: string) {
  return useQuery({
    queryKey: ['gases-disueltos-reports', companyId],
    queryFn: () => listGasesDisueltosReports(companyId),
    enabled: !!companyId,
  });
}

export function useCreateGasesDisueltosReport() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createGasesDisueltosReport(data),
  });
}

export function useUpdateGasesDisueltosReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: Record<string, unknown> }) =>
      updateGasesDisueltosReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gases-disueltos-reports'] });
    },
  });
}

export function useDownloadGasesDisueltosExcel() {
  return useMutation({
    mutationFn: async ({ reportId, filename }: { reportId: string; filename: string }) => {
      const blob = await downloadGasesDisueltosReportExcel(reportId);
      downloadBlob(blob, filename);
    },
  });
}

export function useDownloadGasesDisueltosPDF() {
  return useMutation({
    mutationFn: async ({ reportId, filename }: { reportId: string; filename: string }) => {
      const blob = await downloadGasesDisueltosReportPDF(reportId);
      downloadBlob(blob, filename);
    },
  });
}
