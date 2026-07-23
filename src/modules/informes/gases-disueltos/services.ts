import { apiClient } from '@/src/lib/api/client';
import { type GasesDisueltosReportRecord } from './types';

export async function createGasesDisueltosReport(
  data: Record<string, unknown>,
): Promise<GasesDisueltosReportRecord> {
  return apiClient.post<GasesDisueltosReportRecord>('/reports/gases-disueltos/', data, true);
}

export async function listGasesDisueltosReports(
  companyId: string,
): Promise<GasesDisueltosReportRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await apiClient.get<any>(
    `/reports/gases-disueltos/?company_id=${companyId}`,
    true,
  );

  if (response?.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

export async function getGasesDisueltosReport(
  reportId: string,
): Promise<GasesDisueltosReportRecord> {
  return apiClient.get<GasesDisueltosReportRecord>(`/reports/gases-disueltos/${reportId}/`, true);
}

export async function updateGasesDisueltosReport(
  reportId: string,
  data: Record<string, unknown>,
): Promise<GasesDisueltosReportRecord> {
  return apiClient.patch<GasesDisueltosReportRecord>(
    `/reports/gases-disueltos/${reportId}/`,
    data,
    true,
  );
}

export async function downloadGasesDisueltosReportExcel(reportId: string): Promise<Blob> {
  return apiClient.downloadBlob(`/reports/gases-disueltos/${reportId}/export.xlsx/`, true);
}

export async function downloadGasesDisueltosReportPDF(reportId: string): Promise<Blob> {
  return apiClient.downloadBlob(`/reports/gases-disueltos/${reportId}/export.pdf/`, true);
}
