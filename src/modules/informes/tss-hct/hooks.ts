import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTssHctReport,
  listTssHctReports,
  updateTssHctReport,
  downloadTssHctReportExcel,
  downloadTssHctReportPDF,
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

export function useTssHctReports(companyId: string) {
  return useQuery({
    queryKey: ['tss-hct-reports', companyId],
    queryFn: () => listTssHctReports(companyId),
    enabled: !!companyId,
  });
}

export function useCreateTssHctReport() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createTssHctReport(data),
  });
}

export function useUpdateTssHctReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: Record<string, unknown> }) =>
      updateTssHctReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tss-hct-reports'] });
    },
  });
}

export function useDownloadTssHctExcel() {
  return useMutation({
    mutationFn: async ({ reportId, filename }: { reportId: string; filename: string }) => {
      const blob = await downloadTssHctReportExcel(reportId);
      downloadBlob(blob, filename);
    },
  });
}

export function useDownloadTssHctPDF() {
  return useMutation({
    mutationFn: async ({ reportId, filename }: { reportId: string; filename: string }) => {
      const blob = await downloadTssHctReportPDF(reportId);
      downloadBlob(blob, filename);
    },
  });
}
