import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEnvironmentReport,
  listEnvironmentReports,
  updateEnvironmentReport,
  downloadEnvironmentReportExcel,
  downloadEnvironmentReportPDF,
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

export function useEnvironmentReports(companyId: string) {
  return useQuery({
    queryKey: ['environment-reports', companyId],
    queryFn: () => listEnvironmentReports(companyId),
    enabled: !!companyId,
  });
}

export function useUpdateEnvironmentReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: Record<string, unknown> }) =>
      updateEnvironmentReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environment-reports'] });
    },
  });
}

export function useCreateEnvironmentReport() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createEnvironmentReport(data),
  });
}

export function useDownloadExcel() {
  return useMutation({
    mutationFn: async ({ reportId, filename }: { reportId: string; filename: string }) => {
      const blob = await downloadEnvironmentReportExcel(reportId);
      downloadBlob(blob, filename);
    },
  });
}

export function useDownloadPDF() {
  return useMutation({
    mutationFn: async ({ reportId, filename }: { reportId: string; filename: string }) => {
      const blob = await downloadEnvironmentReportPDF(reportId);
      downloadBlob(blob, filename);
    },
  });
}
