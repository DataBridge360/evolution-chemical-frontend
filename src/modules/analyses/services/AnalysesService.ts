import { apiClient } from '@/src/lib/api/client';
import { Analysis, CreateAnalysisDto, AnalysisWithDetails } from '@/src/types/analysis';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class AnalysesService {
  /**
   * Create or update analysis for a sample
   */
  async createOrUpdateAnalysis(
    sampleId: string,
    analysisData: CreateAnalysisDto,
  ): Promise<Analysis> {
    const response = await apiClient.post<ApiResponse<Analysis>>(
      `/samples/${sampleId}/results`,
      analysisData,
      true,
    );
    return response.data;
  }

  /**
   * Get analysis by sample_id
   */
  async getAnalysisBySampleId(sampleId: string): Promise<Analysis | null> {
    try {
      const response = await apiClient.get<ApiResponse<Analysis>>(
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
   * Get all analyses with details
   */
  async getAllAnalyses(): Promise<AnalysisWithDetails[]> {
    const response = await apiClient.get<ApiResponse<AnalysisWithDetails[]>>('/results', true);
    return response.data;
  }

  /**
   * Get analyses by company
   */
  async getAnalysesByCompany(companyId: string): Promise<AnalysisWithDetails[]> {
    const response = await apiClient.get<ApiResponse<AnalysisWithDetails[]>>(
      `/results/company/${companyId}`,
      true,
    );
    return response.data;
  }

  /**
   * Delete analysis
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/results/${analysisId}`, true);
  }
}

export const analysesService = new AnalysesService();
