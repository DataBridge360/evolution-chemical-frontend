/**
 * Cliente HTTP con refresh automático PROACTIVO
 * El token se renueva ANTES de expirar, el usuario NUNCA ve 401
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Tiempo antes de la expiración para hacer refresh (5 minutos)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos

interface TokenPayload {
  exp: number; // Timestamp de expiración en segundos
  sub: string;
  email: string;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  /**
   * Decodifica el JWT sin verificar la firma (solo para leer la expiración)
   */
  private decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Verifica si el token está por expirar
   * @returns true si expira en menos de 5 minutos
   */
  private isTokenExpiringSoon(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true; // Si no podemos decodificar, asumir que está expirado
    }

    const expirationTime = payload.exp * 1000; // Convertir a milisegundos
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;

    // Si expira en menos de 5 minutos, retornar true
    return timeUntilExpiration < REFRESH_THRESHOLD_MS;
  }

  /**
   * Refresca el access token usando el refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    // Si ya hay un refresh en progreso, esperar a que termine
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('[Auth] Refrescando token proactivamente...');

        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Refresh failed');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('Refresh failed');
        }

        // Guardar nuevos tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        console.log('[Auth] Token refrescado exitosamente');
      } catch (error) {
        console.error('[Auth] Error al refrescar token:', error);

        // Si el refresh falla, limpiar tokens y redirigir a login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Asegura que el token sea válido antes de hacer el request
   */
  private async ensureValidToken(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // No hacer nada en SSR
    }

    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      // No hay token, no hacer nada (el request fallará o es público)
      return;
    }

    // Verificar si el token está por expirar
    if (this.isTokenExpiringSoon(accessToken)) {
      console.log('[Auth] Token próximo a expirar, refrescando...');
      await this.refreshAccessToken();
    }
  }

  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = false,
  ): Promise<T> {
    // PASO 1: Asegurar que el token sea válido ANTES del request
    if (includeAuth) {
      await this.ensureValidToken();
    }

    // PASO 2: Hacer el request con el token actualizado
    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    });

    // PASO 3: Si aún así recibimos 401 (edge case), intentar refresh y reintentar UNA VEZ
    if (response.status === 401 && includeAuth) {
      console.log('[Auth] 401 recibido, intentando refresh de emergencia...');

      try {
        await this.refreshAccessToken();

        // Reintentar el request con el nuevo token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(includeAuth),
            ...options.headers,
          },
        });

        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ message: 'Error desconocido' }));
          throw new Error(error.message || `Error ${retryResponse.status}`);
        }

        return retryResponse.json();
      } catch (refreshError) {
        // Refresh falló, redirigir a login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        throw refreshError;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `Error ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  post<T>(endpoint: string, data?: any, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth,
    );
  }

  put<T>(endpoint: string, data?: any, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth,
    );
  }

  patch<T>(endpoint: string, data?: any, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth,
    );
  }

  delete<T>(endpoint: string, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  /**
   * POST con FormData (sin Content-Type para que el navegador lo añada automáticamente con boundary)
   */
  async postFormData<T>(endpoint: string, formData: FormData, includeAuth: boolean = false): Promise<T> {
    // PASO 1: Asegurar que el token sea válido ANTES del request
    if (includeAuth) {
      await this.ensureValidToken();
    }

    // PASO 2: Hacer el request con FormData
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {};

    // Solo añadir Authorization, NO Content-Type (el navegador lo maneja automáticamente)
    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    // PASO 3: Manejo de errores con reintento si recibimos 401
    if (response.status === 401 && includeAuth) {
      console.log('[Auth] 401 recibido en FormData, intentando refresh de emergencia...');

      try {
        await this.refreshAccessToken();

        // Reintentar con nuevo token
        const newToken = localStorage.getItem('accessToken');
        const retryHeaders: HeadersInit = {};
        if (newToken) {
          retryHeaders['Authorization'] = `Bearer ${newToken}`;
        }

        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: retryHeaders,
          body: formData,
        });

        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ message: 'Error desconocido' }));
          throw new Error(error.message || `Error ${retryResponse.status}`);
        }

        return retryResponse.json();
      } catch (refreshError) {
        // Refresh falló, redirigir a login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        throw refreshError;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `Error ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
