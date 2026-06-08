/**
 * Servicio para análisis cromatográfico
 * Usa apiClient para obtener refresh automático de tokens
 */

import { apiClient } from '@/src/lib/api/client';
import {
  ChromatographicAnalysis,
  AnalysisReport,
  UploadXLSXResponse,
  CalculatePropertiesRequest,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedPayload<T> {
  data?: T[];
  results?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  count?: number;
  next?: string | null;
  previous?: string | null;
}

interface DrfPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface DownloadHistoryParams {
  companyId: string;
  dateFrom?: string;
  dateTo?: string;
}

export type ChromatographicAnalysisUpdate = Partial<
  Omit<
    ChromatographicAnalysis,
    | 'analysis_date'
    | 'sample_date'
    | 'operating_pressure_kpa'
    | 'operating_temperature_c'
    | 'flow_rate'
    | 'pdt'
    | 'data_acquisition_date'
    | 'zone'
    | 'formation'
    | 'sampled_by'
    | 'last_calibration_date'
  >
> & {
  analysis_date?: string | null;
  sample_date?: string | null;
  operating_pressure_kpa?: number | null;
  operating_temperature_c?: number | null;
  flow_rate?: number | null;
  pdt?: string | null;
  data_acquisition_date?: string | null;
  zone?: string | null;
  formation?: string | null;
  sampled_by?: string | null;
  last_calibration_date?: string | null;
};

type CollectionResponse<T> =
  | T[]
  | ApiResponse<T[]>
  | ApiResponse<PaginatedPayload<T>>
  | DrfPaginatedResponse<T>
  | PaginatedPayload<T>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractCollectionFromRecord<T>(value: Record<string, unknown>): T[] | null {
  if (Array.isArray(value.results)) {
    return value.results as T[];
  }

  if (Array.isArray(value.data)) {
    return value.data as T[];
  }

  return null;
}

function unwrapCollectionResponse<T>(response: CollectionResponse<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  const directCollection = extractCollectionFromRecord<T>(response);
  if (directCollection) {
    return directCollection;
  }

  if (isRecord(response.data)) {
    const nestedCollection = extractCollectionFromRecord<T>(response.data);
    if (nestedCollection) {
      return nestedCollection;
    }
  }

  throw new Error('Formato inesperado en listado de cromatografía');
}

/**
 * Sube un archivo XLSX del cromatógrafo y crea un análisis borrador
 */
export async function uploadXLSXFile(
  file: File,
  metadata: { company_id: string; field_name?: string; well_name?: string },
): Promise<UploadXLSXResponse> {
  const formData = new FormData();
  formData.append('xlsx_file', file);
  formData.append('company_id', metadata.company_id);

  if (metadata.field_name) {
    formData.append('field_name', metadata.field_name);
  }
  if (metadata.well_name) {
    formData.append('well_name', metadata.well_name);
  }

  try {
    // Usar el nuevo método postFormData que maneja refresh automático
    return await apiClient.postFormData<UploadXLSXResponse>(
      '/chromatography/analyses/upload-xlsx/',
      formData,
      true, // includeAuth
    );
  } catch (error: any) {
    throw new Error(error.message || 'Error subiendo archivo XLSX');
  }
}

/**
 * Lista todos los análisis cromatográficos
 */
export async function listAnalyses(): Promise<ChromatographicAnalysis[]> {
  const response = await apiClient.get<CollectionResponse<ChromatographicAnalysis>>(
    '/chromatography/analyses/',
    true, // includeAuth
  );

  return unwrapCollectionResponse(response);
}

/**
 * Obtiene análisis cromatográficos filtrados por empresa
 */
export async function getAnalysesByCompanyId(
  companyId: string,
): Promise<ChromatographicAnalysis[]> {
  try {
    const response = await apiClient.get<CollectionResponse<ChromatographicAnalysis>>(
      `/chromatography/analyses/company/${companyId}/`,
      true, // includeAuth
    );

    return unwrapCollectionResponse(response);
  } catch (error: any) {
    throw new Error(error.message || 'Error obteniendo análisis de la empresa');
  }
}

/**
 * Obtiene un análisis por ID
 */
export async function getAnalysis(analysisId: string): Promise<ChromatographicAnalysis> {
  try {
    return await apiClient.get<ChromatographicAnalysis>(
      `/chromatography/analyses/${analysisId}/`,
      true, // includeAuth
    );
  } catch (error: any) {
    // Mejorar mensajes de error
    if (error.message?.includes('401')) {
      throw new Error('No autenticado - 401');
    } else if (error.message?.includes('404')) {
      throw new Error('Análisis no encontrado - 404');
    }
    throw new Error(error.message || 'Error obteniendo análisis');
  }
}

/**
 * Actualiza un análisis
 */
export async function updateAnalysis(
  analysisId: string,
  data: ChromatographicAnalysisUpdate,
): Promise<ChromatographicAnalysis> {
  try {
    return await apiClient.patch<ChromatographicAnalysis>(
      `/chromatography/analyses/${analysisId}/`,
      data,
      true, // includeAuth
    );
  } catch (error: any) {
    throw new Error(error.message || 'Error actualizando análisis');
  }
}

/**
 * Calcula las propiedades del análisis
 */
export async function calculateProperties(
  analysisId: string,
  options?: CalculatePropertiesRequest,
): Promise<ChromatographicAnalysis> {
  try {
    return await apiClient.post<ChromatographicAnalysis>(
      `/chromatography/analyses/${analysisId}/calculate/`,
      options || {},
      true, // includeAuth
    );
  } catch (error: any) {
    throw new Error(error.message || 'Error calculando propiedades');
  }
}

/**
 * Aprueba un análisis calculado
 */
export async function approveAnalysis(analysisId: string): Promise<ChromatographicAnalysis> {
  try {
    return await apiClient.post<ChromatographicAnalysis>(
      `/chromatography/analyses/${analysisId}/approve/`,
      {},
      true, // includeAuth
    );
  } catch (error: any) {
    throw new Error(error.message || 'Error aprobando análisis');
  }
}

/**
 * Genera el informe HTML del análisis y lo guarda en la BD
 */
export async function generateReport(
  analysisId: string,
): Promise<{ html: string; analysis_id: string; status: string }> {
  try {
    return await apiClient.post<{ html: string; analysis_id: string; status: string }>(
      `/chromatography/analyses/${analysisId}/generate-report/`,
      {},
      true, // includeAuth
    );
  } catch (error: any) {
    throw new Error(error.message || 'Error generando informe');
  }
}

export async function downloadChromatographyHistory({
  companyId,
  dateFrom,
  dateTo,
}: DownloadHistoryParams): Promise<Blob> {
  const params = new URLSearchParams({ company_id: companyId });

  if (dateFrom && dateTo) {
    params.set('date_from', dateFrom);
    params.set('date_to', dateTo);
  }

  try {
    return await apiClient.downloadBlob(
      `/chromatography/analyses/history.xlsx/?${params.toString()}`,
      true,
    );
  } catch (error: any) {
    throw new Error(error.message || 'Error descargando historial de cromatografía');
  }
}

/**
 * Elimina un análisis
 */
export async function deleteAnalysis(analysisId: string): Promise<void> {
  try {
    await apiClient.delete<void>(
      `/chromatography/analyses/${analysisId}/`,
      true, // includeAuth
    );
  } catch (error: any) {
    throw new Error(error.message || 'Error eliminando análisis');
  }
}

/**
 * Lista los reportes de un análisis
 */
export async function listReports(analysisId?: string): Promise<AnalysisReport[]> {
  const endpoint = analysisId
    ? `/chromatography/reports/?analysis=${analysisId}`
    : '/chromatography/reports/';

  try {
    return await apiClient.get<AnalysisReport[]>(endpoint, true); // includeAuth
  } catch (error: any) {
    throw new Error(error.message || 'Error obteniendo lista de reportes');
  }
}
