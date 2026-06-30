'use client';

import { useCountdown } from '../../hooks/useCountdown';
import { cn } from '@/src/lib/utils/cn';

/**
 * Props para el componente RateLimitAlert
 */
interface RateLimitAlertProps {
  /**
   * Timestamp Unix (segundos) de cuándo expira el bloqueo.
   * null si no está bloqueado.
   */
  lockedUntil: number | null;

  /**
   * Segundos hasta que expire el bloqueo.
   * null si no está bloqueado.
   */
  retryAfter: number | null;

  /**
   * Intentos restantes antes del bloqueo.
   * null si no hay intentos fallidos o si ya está bloqueado.
   */
  attemptsRemaining: number | null;

  /**
   * Clase CSS adicional (opcional)
   */
  className?: string;
}

/**
 * Componente que muestra alertas de rate limiting.
 *
 * Dos modos:
 * 1. Bloqueado (lockedUntil !== null): Muestra mensaje de error con countdown
 * 2. Intentos restantes (attemptsRemaining !== null): Muestra warning con intentos
 *
 * @example
 * ```tsx
 * // Usuario bloqueado
 * <RateLimitAlert
 *   lockedUntil={1736943000}
 *   retryAfter={900}
 *   attemptsRemaining={null}
 * />
 *
 * // Intentos restantes
 * <RateLimitAlert
 *   lockedUntil={null}
 *   retryAfter={null}
 *   attemptsRemaining={2}
 * />
 * ```
 */
export function RateLimitAlert({
  lockedUntil,
  retryAfter,
  attemptsRemaining,
  className,
}: RateLimitAlertProps) {
  const { minutes, seconds, isExpired } = useCountdown(lockedUntil);

  // No mostrar nada si no hay información de rate limiting
  if (!lockedUntil && attemptsRemaining === null) {
    return null;
  }

  // Si estaba bloqueado pero ya expiró, no mostrar nada
  if (lockedUntil && isExpired) {
    return null;
  }

  // Modo: Cuenta bloqueada
  if (lockedUntil && !isExpired) {
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return (
      <div
        className={cn('animate-in fade-in slide-in-from-top-1 duration-200', className)}
        role="alert"
        aria-live="assertive"
      >
        {/* Mensaje principal */}
        <p className="text-sm font-medium text-red-600">
          Cuenta bloqueada temporalmente por seguridad
        </p>

        {/* Countdown */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xs text-slate-500">Podrás intentar nuevamente en</span>
          <div className="inline-flex items-baseline gap-1 font-mono text-sm font-semibold text-slate-700">
            <span className="tabular-nums">{minutes}</span>
            <span className="text-[10px] text-slate-400">min</span>
            <span className="text-slate-300">:</span>
            <span className="tabular-nums">{formattedSeconds}</span>
            <span className="text-[10px] text-slate-400">seg</span>
          </div>
        </div>

        {/* Ayuda */}
        <p className="mt-2 text-xs text-slate-400">
          Si olvidaste tu contraseña, contacta al administrador
        </p>
      </div>
    );
  }

  // Modo: Intentos restantes (warning)
  if (attemptsRemaining !== null && attemptsRemaining > 0) {
    const isLastAttempt = attemptsRemaining === 1;

    return (
      <div
        className={cn('animate-in fade-in slide-in-from-top-1 duration-200', className)}
        role="alert"
        aria-live="polite"
      >
        <p
          className={cn(
            'text-sm font-medium',
            isLastAttempt ? 'text-orange-600' : 'text-amber-600',
          )}
        >
          {isLastAttempt ? (
            <>Último intento antes del bloqueo temporal</>
          ) : (
            <>Te {attemptsRemaining === 1 ? 'queda' : `quedan ${attemptsRemaining} intentos`}</>
          )}
        </p>
        {isLastAttempt && (
          <p className="mt-1 text-xs text-slate-500">
            La cuenta se bloqueará por 15 minutos tras el próximo error
          </p>
        )}
      </div>
    );
  }

  return null;
}
