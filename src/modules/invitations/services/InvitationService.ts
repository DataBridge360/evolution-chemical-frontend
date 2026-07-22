import { apiClient } from '@/src/lib/api/client';

interface InviteUserDto {
  email: string;
  role?: string;
}

interface CompleteInvitationDto {
  token: string;
  email: string;
  name: string;
  password: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class InvitationService {
  /**
   * Invitar usuario a una empresa
   */
  async inviteUser(companyId: string, data: InviteUserDto) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/companies/${companyId}/invite-user/`,
      data,
      true,
    );
    return response.data;
  }

  /**
   * Validar token de invitación
   */
  async validateInvitation(token: string, email: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      '/auth/validate-invitation/',
      { token, email },
      false,
    );
    return response.data;
  }

  /**
   * Completar registro después de invitación
   */
  async completeInvitation(data: CompleteInvitationDto) {
    const response = await apiClient.post<ApiResponse<any>>(
      '/auth/complete-invitation/',
      data,
      false,
    );

    // Guardar tokens si existen
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  }
}

export const invitationService = new InvitationService();
