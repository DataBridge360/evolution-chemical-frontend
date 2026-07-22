import { apiClient } from '@/src/lib/api/client';
import { Company, CreateCompanyDto } from '@/src/types/company';
import { User } from '@/src/types/user';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class CompaniesService {
  async getAllCompanies(): Promise<Company[]> {
    const response = await apiClient.get<ApiResponse<Company[]>>('/companies/', true);
    return response.data;
  }

  async getCompanyById(id: string): Promise<Company> {
    const response = await apiClient.get<ApiResponse<Company>>(`/companies/${id}/`, true);
    return response.data;
  }

  async createCompany(data: CreateCompanyDto): Promise<Company> {
    const payload = {
      ...data,
      email: cleanOptionalString(data.email),
      phone: cleanOptionalString(data.phone),
    };
    const response = await apiClient.post<ApiResponse<Company>>('/companies/', payload, true);
    return response.data;
  }

  async updateViewResultsPermission(companyId: string, canViewResults: boolean): Promise<Company> {
    const response = await apiClient.patch<ApiResponse<Company>>(
      `/companies/${companyId}/view-results-permission/`,
      { can_view_results: canViewResults },
      true,
    );
    return response.data;
  }

  async getCompanyUsers(companyId: string): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      `/companies/${companyId}/users/`,
      true,
    );
    return response.data;
  }

  async getCompanyInvitations(companyId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/companies/${companyId}/invitations/`,
      true,
    );
    return response.data;
  }
}

export const companiesService = new CompaniesService();

function cleanOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
