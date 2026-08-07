/**
 * Service for Water Historic (TSS, HcT, dissolved gases, residual).
 * Uses apiClient for automatic token refresh.
 */

import { apiClient } from '@/src/lib/api/client';
import type {
  WaterHistoricRecord,
  WaterHistoricFilters,
  PaginatedWaterHistoricResponse,
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

/**
 * List water historic records with pagination.
 */
export async function listWaterHistoricPaginated(
  filters: WaterHistoricFilters & { page?: number; ordering?: string },
): Promise<PaginatedWaterHistoricResponse> {
  const params = new URLSearchParams();
  if (filters.company_id) params.set('company_id', filters.company_id);
  if (filters.oilfield) params.set('oilfield', filters.oilfield);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.ordering) params.set('ordering', filters.ordering);

  const response = await apiClient.get<unknown>(`/historics/water/?${params.toString()}`, true);

  const obj = response as Record<string, unknown>;
  const paginated =
    typeof obj.data === 'object' && obj.data !== null && 'totalPages' in (obj.data as object)
      ? (obj.data as PaginatedWaterHistoricResponse)
      : (obj as unknown as PaginatedWaterHistoricResponse);

  return {
    data: Array.isArray(paginated.data) ? paginated.data : [],
    total: paginated.total ?? 0,
    page: paginated.page ?? 1,
    limit: paginated.limit ?? 10,
    totalPages: paginated.totalPages ?? 1,
  };
}

/**
 * Get a single water historic record by ID.
 */
export async function getWaterHistoricRecord(id: string): Promise<WaterHistoricRecord> {
  const response = await apiClient.get<ApiResponse<WaterHistoricRecord>>(
    `/historics/water/${id}/`,
    true,
  );
  return unwrapResponse(response);
}

/**
 * Delete a water historic record.
 */
export async function deleteWaterHistoricRecord(id: string): Promise<void> {
  await apiClient.delete<void>(`/historics/water/${id}/`, true);
}

/**
 * Partially update a water historic record (PATCH).
 */
export async function patchWaterHistoricRecord(
  id: string,
  data: Partial<WaterHistoricRecord>,
): Promise<WaterHistoricRecord> {
  const response = await apiClient.patch<ApiResponse<WaterHistoricRecord>>(
    `/historics/water/${id}/`,
    data,
    true,
  );
  return unwrapResponse(response);
}

/**
 * Download the water historic Excel file.
 */
export async function downloadWaterHistoricExcel(filters: WaterHistoricFilters): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters.company_id) params.set('company_id', filters.company_id);
  if (filters.oilfield) params.set('oilfield', filters.oilfield);

  return apiClient.downloadBlob(`/historics/water/export.xlsx/?${params.toString()}`, true);
}
