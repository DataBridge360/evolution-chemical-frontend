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
  return apiClient.get<ChromatographicAnalysis[]>(
    '/chromatography/analyses/',
    true, // includeAuth
  );
}

/**
 * Obtiene análisis cromatográficos filtrados por empresa
 */
export async function getAnalysesByCompanyId(
  companyId: string,
): Promise<ChromatographicAnalysis[]> {
  try {
    return await apiClient.get<ChromatographicAnalysis[]>(
      `/chromatography/analyses/company/${companyId}/`,
      true, // includeAuth
    );
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
  data: Partial<ChromatographicAnalysis>,
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
