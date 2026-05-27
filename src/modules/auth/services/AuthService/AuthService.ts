import { apiClient } from '@/src/lib/api/client';

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  message: string;
}

interface RegisterResponse {
  success: boolean;
  data: {
    user: any;
    session: any;
  };
  message: string;
}

/**
 * AuthService - SOLO llamadas HTTP al backend
 * CERO lógica de autenticación en el frontend
 */
class AuthService {
  /**
   * Login - El backend maneja TODO
   */
  async login(email: string, password: string): Promise<LoginResponse['data']> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    // Guardar tokens en localStorage
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  }

  /**
   * Register
   */
  async register(email: string, password: string, name: string): Promise<RegisterResponse['data']> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', {
      email,
      password,
      name,
    });

    return response.data;
  }

  /**
   * Logout - Optimistic/Instantaneous
   * Limpia el localStorage INMEDIATAMENTE y llama al backend en background.
   * El usuario ve el logout instantáneo sin esperar la respuesta del servidor.
   */
  async logout(): Promise<void> {
    // 1. Capturar token ANTES de limpiar (para enviar al backend)
    const accessToken = localStorage.getItem('accessToken');

    // 2. Limpiar tokens locales INMEDIATAMENTE (instantáneo, 0ms)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // 3. Llamar al backend en background (fire-and-forget)
    // Usa el token capturado ANTES de limpiar
    if (accessToken) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Silenciar errores - el logout ya ocurrió en el cliente
        console.debug('Backend logout cleanup completado');
      });
    }

    // 4. Retornar inmediatamente - el usuario ya está "logged out"
    return Promise.resolve();
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Refrescar token
   */
  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
  }
}

export const authService = new AuthService();
