/**
 * Servicio para análisis cromatográfico
 */

import {
  ChromatographicAnalysis,
  AnalysisReport,
  UploadXLSXRequest,
  UploadXLSXResponse,
  CalculatePropertiesRequest,
  GenerateReportRequest,
} from '../types';

// NEXT_PUBLIC_API_URL ya incluye /api/v1
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_BASE = `${BASE_URL}/chromatography`;

/**
 * Obtiene el token de autenticación del localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken'); // Sin guión bajo, como lo guarda AuthService
}

/**
 * Headers comunes para las peticiones
 */
function getHeaders(includeContentType = true): HeadersInit {
  const headers: HeadersInit = {};
  const token = getAuthToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Sube un archivo XLSX del cromatógrafo y crea un análisis borrador
 */
export async function uploadXLSXFile(
  file: File,
  metadata?: Partial<UploadXLSXRequest>,
): Promise<UploadXLSXResponse> {
  const formData = new FormData();
  formData.append('xlsx_file', file);

  if (metadata?.company_name) {
    formData.append('company_name', metadata.company_name);
  }
  if (metadata?.field_name) {
    formData.append('field_name', metadata.field_name);
  }
  if (metadata?.well_name) {
    formData.append('well_name', metadata.well_name);
  }

  const response = await fetch(`${API_BASE}/analyses/upload-xlsx/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error subiendo archivo XLSX');
  }

  return response.json();
}

/**
 * Lista todos los análisis cromatográficos
 */
export async function listAnalyses(): Promise<ChromatographicAnalysis[]> {
  const response = await fetch(`${API_BASE}/analyses/`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error obteniendo lista de análisis');
  }

  return response.json();
}

/**
 * Obtiene un análisis por ID
 */
export async function getAnalysis(analysisId: string): Promise<ChromatographicAnalysis> {
  const response = await fetch(`${API_BASE}/analyses/${analysisId}/`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autenticado - 401');
    } else if (response.status === 404) {
      throw new Error('Análisis no encontrado - 404');
    }
    throw new Error('Error obteniendo análisis');
  }

  return response.json();
}

/**
 * Actualiza un análisis
 */
export async function updateAnalysis(
  analysisId: string,
  data: Partial<ChromatographicAnalysis>,
): Promise<ChromatographicAnalysis> {
  const response = await fetch(`${API_BASE}/analyses/${analysisId}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error actualizando análisis');
  }

  return response.json();
}

/**
 * Calcula las propiedades del análisis
 */
export async function calculateProperties(
  analysisId: string,
  options?: CalculatePropertiesRequest,
): Promise<ChromatographicAnalysis> {
  const response = await fetch(`${API_BASE}/analyses/${analysisId}/calculate/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error calculando propiedades');
  }

  return response.json();
}

/**
 * Aprueba un análisis calculado
 */
export async function approveAnalysis(analysisId: string): Promise<ChromatographicAnalysis> {
  const response = await fetch(`${API_BASE}/analyses/${analysisId}/approve/`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error aprobando análisis');
  }

  return response.json();
}

/**
 * Genera el informe HTML del análisis y lo guarda en la BD
 */
export async function generateReport(
  analysisId: string,
): Promise<{ html: string; analysis_id: string; status: string }> {
  const response = await fetch(`${API_BASE}/analyses/${analysisId}/generate-report/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error generando informe');
  }

  return response.json();
}

/**
 * Elimina un análisis
 */
export async function deleteAnalysis(analysisId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/analyses/${analysisId}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error eliminando análisis');
  }
}

/**
 * Lista los reportes de un análisis
 */
export async function listReports(analysisId?: string): Promise<AnalysisReport[]> {
  const url = analysisId ? `${API_BASE}/reports/?analysis=${analysisId}` : `${API_BASE}/reports/`;

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error obteniendo lista de reportes');
  }

  return response.json();
}
