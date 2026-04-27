import { apiClient } from '@/src/lib/api/client';
import {
  SampleResult,
  CreateSampleResultDto,
  SampleResultWithDetails,
} from '@/src/types/sampleResult';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ResultsService {
  /**
   * Crear o actualizar resultados de una muestra
   */
  async createOrUpdateResult(
    sampleId: string,
    resultData: CreateSampleResultDto,
  ): Promise<SampleResult> {
    const response = await apiClient.post<ApiResponse<SampleResult>>(
      `/samples/${sampleId}/results`,
      resultData,
      true,
    );
    return response.data;
  }

  /**
   * Obtener resultados por sample_id
   */
  async getResultBySampleId(sampleId: string): Promise<SampleResult | null> {
    try {
      const response = await apiClient.get<ApiResponse<SampleResult>>(
        `/samples/${sampleId}/results`,
        true,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtener todos los resultados con detalles
   */
  async getAllResults(): Promise<SampleResultWithDetails[]> {
    const response = await apiClient.get<ApiResponse<SampleResultWithDetails[]>>('/results', true);
    return response.data;
  }

  /**
   * Obtener resultados por compañía
   */
  async getResultsByCompany(companyId: string): Promise<SampleResultWithDetails[]> {
    const response = await apiClient.get<ApiResponse<SampleResultWithDetails[]>>(
      `/results/company/${companyId}`,
      true,
    );
    return response.data;
  }

  /**
   * Eliminar resultado
   */
  async deleteResult(resultId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/results/${resultId}`, true);
  }
}

export const resultsService = new ResultsService();
