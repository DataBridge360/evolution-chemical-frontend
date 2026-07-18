import { apiClient } from '@/src/lib/api/client';
import { type EnvironmentReportRecord } from './types';

export async function createEnvironmentReport(
  data: Record<string, unknown>,
): Promise<EnvironmentReportRecord> {
  return apiClient.post<EnvironmentReportRecord>('/reports/environment/', data, true);
}

export async function listEnvironmentReports(
  companyId: string,
): Promise<EnvironmentReportRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await apiClient.get<any>(`/reports/environment/?company_id=${companyId}`, true);

  // Handle paginated response: { success, data: { data: [...] } }
  if (response?.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  // Handle flat wrapped: { success, data: [...] }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  // Handle plain array
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

export async function getEnvironmentReport(reportId: string): Promise<EnvironmentReportRecord> {
  return apiClient.get<EnvironmentReportRecord>(`/reports/environment/${reportId}/`, true);
}

export async function updateEnvironmentReport(
  reportId: string,
  data: Record<string, unknown>,
): Promise<EnvironmentReportRecord> {
  return apiClient.patch<EnvironmentReportRecord>(`/reports/environment/${reportId}/`, data, true);
}

export async function downloadEnvironmentReportExcel(reportId: string): Promise<Blob> {
  return apiClient.downloadBlob(`/reports/environment/${reportId}/export.xlsx/`, true);
}

export async function downloadEnvironmentReportPDF(reportId: string): Promise<Blob> {
  return apiClient.downloadBlob(`/reports/environment/${reportId}/export.pdf/`, true);
}
