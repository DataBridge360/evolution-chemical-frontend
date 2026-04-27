import { apiClient } from '@/src/lib/api/client';
import { Company } from '@/src/types/company';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class CompaniesService {
  async getAllCompanies(): Promise<Company[]> {
    const response = await apiClient.get<ApiResponse<Company[]>>('/companies', true);
    return response.data;
  }

  async getCompanyById(id: string): Promise<Company> {
    const response = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`, true);
    return response.data;
  }

  async updateViewResultsPermission(companyId: string, canViewResults: boolean): Promise<Company> {
    const response = await apiClient.patch<ApiResponse<Company>>(
      `/companies/${companyId}/view-results-permission`,
      { can_view_results: canViewResults },
      true,
    );
    return response.data;
  }
}

export const companiesService = new CompaniesService();
