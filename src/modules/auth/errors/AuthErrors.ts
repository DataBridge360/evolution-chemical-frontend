/**
 * Clases de error personalizadas para autenticación y rate limiting.
 *
 * Estas clases extienden Error nativo y agregan propiedades específicas
 * para manejar diferentes tipos de errores de autenticación.
 */

/**
 * Error lanzado cuando una cuenta está bloqueada por rate limiting (403).
 *
 * Se lanza cuando el usuario ha alcanzado el máximo de intentos fallidos
 * y la cuenta está temporalmente bloqueada.
 */
export class RateLimitError extends Error {
  /**
   * Timestamp Unix (segundos) de cuándo expira el bloqueo
   */
  public readonly lockedUntil: number;

  /**
   * Segundos restantes hasta que expire el bloqueo
   */
  public readonly retryAfter: number;

  constructor(message: string, lockedUntil: number, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.lockedUntil = lockedUntil;
    this.retryAfter = retryAfter;

    // Mantener stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }
}

/**
 * Error lanzado cuando las credenciales son inválidas (401).
 *
 * Incluye información sobre cuántos intentos le quedan al usuario
 * antes de ser bloqueado.
 */
export class AuthError extends Error {
  /**
   * Intentos restantes antes del bloqueo (opcional)
   * undefined si no se proporciona
   */
  public readonly attemptsRemaining?: number;

  constructor(message: string, attemptsRemaining?: number) {
    super(message);
    this.name = 'AuthError';
    this.attemptsRemaining = attemptsRemaining;

    // Mantener stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}
