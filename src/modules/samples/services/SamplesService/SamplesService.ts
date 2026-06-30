import { apiClient } from '@/src/lib/api/client';
import { Sample, CreateSampleDto, PaginatedSamplesResponse } from '@/src/types/sample';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class SamplesService {
  /**
   * Obtener todas las muestras (owner ve todas, company_admin solo las suyas)
   * DEPRECATED - Usar getAllSamplesPaginated
   */
  async getAllSamples(): Promise<Sample[]> {
    const response = await apiClient.get<ApiResponse<Sample[]>>('/samples', true);
    return response.data;
  }

  /**
   * Obtener muestras paginadas (owner ve todas, company_admin solo las suyas)
   */
  async getAllSamplesPaginated(
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedSamplesResponse> {
    const response = await apiClient.get<ApiResponse<PaginatedSamplesResponse>>(
      `/samples?page=${page}&limit=${limit}`,
      true,
    );
    return response.data;
  }

  /**
   * Obtener muestra por ID
   */
  async getSampleById(id: string): Promise<Sample> {
    const response = await apiClient.get<ApiResponse<Sample>>(`/samples/${id}`, true);
    return response.data;
  }

  /**
   * Crear nueva muestra
   */
  async createSample(data: CreateSampleDto): Promise<Sample> {
    const response = await apiClient.post<ApiResponse<Sample>>('/samples', data, true);
    return response.data;
  }

  /**
   * Actualizar muestra
   */
  async updateSample(id: string, data: Partial<CreateSampleDto>): Promise<Sample> {
    const response = await apiClient.put<ApiResponse<Sample>>(`/samples/${id}`, data, true);
    return response.data;
  }

  /**
   * Mover muestra a la papelera (soft delete, solo owner).
   * Se conserva 7 días y luego se elimina automáticamente.
   */
  async deleteSample(id: string): Promise<void> {
    await apiClient.delete(`/samples/${id}`, true);
  }

  /**
   * Listar las muestras que están en la papelera (solo owner)
   */
  async getTrash(): Promise<Sample[]> {
    const response = await apiClient.get<ApiResponse<Sample[]>>('/samples/trash/', true);
    return response.data;
  }

  /**
   * Restaurar una muestra desde la papelera (solo owner)
   */
  async restore(id: string): Promise<Sample> {
    const response = await apiClient.post<ApiResponse<Sample>>(`/samples/${id}/restore/`, {}, true);
    return response.data;
  }

  /**
   * Eliminar permanentemente una muestra de la papelera (solo owner).
   * Requiere la contraseña del usuario. Lanza error si es incorrecta.
   */
  async permanentDelete(id: string, password: string): Promise<void> {
    await apiClient.post(`/samples/${id}/permanent-delete/`, { password }, true);
  }
}

export const samplesService = new SamplesService();
