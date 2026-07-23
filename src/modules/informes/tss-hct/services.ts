import { apiClient } from '@/src/lib/api/client';
import { type TssHctReportRecord } from './types';

export async function createTssHctReport(
  data: Record<string, unknown>,
): Promise<TssHctReportRecord> {
  return apiClient.post<TssHctReportRecord>('/reports/tss-hct/', data, true);
}

export async function listTssHctReports(companyId: string): Promise<TssHctReportRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await apiClient.get<any>(`/reports/tss-hct/?company_id=${companyId}`, true);

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

export async function getTssHctReport(reportId: string): Promise<TssHctReportRecord> {
  return apiClient.get<TssHctReportRecord>(`/reports/tss-hct/${reportId}/`, true);
}

export async function updateTssHctReport(
  reportId: string,
  data: Record<string, unknown>,
): Promise<TssHctReportRecord> {
  return apiClient.patch<TssHctReportRecord>(`/reports/tss-hct/${reportId}/`, data, true);
}

export async function downloadTssHctReportExcel(reportId: string): Promise<Blob> {
  return apiClient.downloadBlob(`/reports/tss-hct/${reportId}/export.xlsx/`, true);
}

export async function downloadTssHctReportPDF(reportId: string): Promise<Blob> {
  return apiClient.downloadBlob(`/reports/tss-hct/${reportId}/export.pdf/`, true);
}
