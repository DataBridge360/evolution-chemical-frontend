/**
 * Service for Historic FQ Type A (physicochemical water analysis).
 * Uses apiClient for automatic token refresh.
 */

import { apiClient } from '@/src/lib/api/client';
import type {
  HistoricFQTypeARecord,
  UploadHistoricMetadata,
  HistoricFQTypeAFilters,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function unwrapResponse<T>(response: T | ApiResponse<T>): T {
  if (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response
  ) {
    return (response as ApiResponse<T>).data;
  }
  return response;
}

function unwrapArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (typeof response === 'object' && response !== null) {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as T[];
    }
    if (Array.isArray(record.results)) {
      return record.results as T[];
    }
    // Handle double-wrapping: ApiResponse.success({ data: [...], ... })
    // where record.data is the pagination object containing the actual array
    if (typeof record.data === 'object' && record.data !== null) {
      const inner = record.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) {
        return inner.data as T[];
      }
      if (Array.isArray(inner.results)) {
        return inner.results as T[];
      }
    }
  }

  return [];
}

/**
 * Upload an informe file (XLSX/PDF) and create a historic record.
 */
export async function uploadHistoricFile(
  file: File,
  metadata: UploadHistoricMetadata,
): Promise<HistoricFQTypeARecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('company_id', metadata.company_id);
  formData.append('oilfield', metadata.oilfield);
  formData.append('localidad', metadata.localidad);
  formData.append('plant', metadata.plant);
  formData.append('equipment', metadata.equipment);

  const response = await apiClient.postFormData<ApiResponse<HistoricFQTypeARecord>>(
    '/historics/fq-type-a/upload/',
    formData,
    true,
  );

  return unwrapResponse(response);
}

/**
 * List historic FQ Type A records with optional filters.
 */
export async function listHistoricRecords(
  filters?: HistoricFQTypeAFilters,
): Promise<HistoricFQTypeARecord[]> {
  const params = new URLSearchParams();
  if (filters?.company_id) params.set('company_id', filters.company_id);
  if (filters?.oilfield) params.set('oilfield', filters.oilfield);
  if (filters?.localidad) params.set('localidad', filters.localidad);

  const query = params.toString();
  const endpoint = `/historics/fq-type-a/${query ? `?${query}` : ''}`;

  const response = await apiClient.get<unknown>(endpoint, true);
  return unwrapArrayResponse<HistoricFQTypeARecord>(response);
}

/**
 * Get a single historic record by ID.
 */
export async function getHistoricRecord(id: string): Promise<HistoricFQTypeARecord> {
  const response = await apiClient.get<ApiResponse<HistoricFQTypeARecord>>(
    `/historics/fq-type-a/${id}/`,
    true,
  );
  return unwrapResponse(response);
}

/**
 * Delete a historic record.
 */
export async function deleteHistoricRecord(id: string): Promise<void> {
  await apiClient.delete<void>(`/historics/fq-type-a/${id}/`, true);
}

/**
 * Partially update a historic record (PATCH).
 */
export async function patchHistoricRecord(
  id: string,
  data: Partial<HistoricFQTypeARecord>,
): Promise<HistoricFQTypeARecord> {
  const response = await apiClient.patch<ApiResponse<HistoricFQTypeARecord>>(
    `/historics/fq-type-a/${id}/`,
    data,
    true,
  );
  return unwrapResponse(response);
}

/**
 * Download the historic Excel file (formatted like the reference template).
 */
export async function downloadHistoricExcel(filters: HistoricFQTypeAFilters): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters.company_id) params.set('company_id', filters.company_id);
  if (filters.oilfield) params.set('oilfield', filters.oilfield);
  if (filters.localidad) params.set('localidad', filters.localidad);

  return apiClient.downloadBlob(`/historics/fq-type-a/export.xlsx/?${params.toString()}`, true);
}
