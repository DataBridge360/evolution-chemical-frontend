import { useState, useEffect } from 'react';

/**
 * Resultado del hook useCountdown
 */
interface UseCountdownResult {
  /**
   * Minutos restantes (ej: 14)
   */
  minutes: number;

  /**
   * Segundos restantes (ej: 32)
   */
  seconds: number;

  /**
   * Si el countdown ha expirado
   */
  isExpired: boolean;
}

/**
 * Hook para countdown timer.
 *
 * Calcula y actualiza automáticamente el tiempo restante hasta un timestamp objetivo.
 * Se actualiza cada segundo y retorna minutos y segundos restantes.
 *
 * @param targetTimestamp - Timestamp Unix (en segundos) objetivo, o null si no hay countdown activo
 * @returns Objeto con minutes, seconds, e isExpired
 *
 * @example
 * ```tsx
 * const lockedUntil = 1736943000; // Unix timestamp
 * const { minutes, seconds, isExpired } = useCountdown(lockedUntil);
 *
 * if (isExpired) {
 *   return <p>Bloqueo expirado</p>;
 * }
 *
 * return <p>Bloqueado por {minutes}:{seconds.toString().padStart(2, '0')}</p>;
 * ```
 */
export function useCountdown(targetTimestamp: number | null): UseCountdownResult {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    // Si no hay timestamp objetivo, no hay countdown
    if (!targetTimestamp) {
      setTimeRemaining(0);
      return;
    }

    // Función para actualizar el tiempo restante
    const updateTimeRemaining = () => {
      const now = Date.now() / 1000; // Convertir a segundos
      const remaining = Math.max(0, targetTimestamp - now);
      setTimeRemaining(remaining);
    };

    // Actualizar inmediatamente
    updateTimeRemaining();

    // Actualizar cada segundo
    const interval = setInterval(() => {
      updateTimeRemaining();

      // Limpiar interval cuando expira
      const now = Date.now() / 1000;
      if (now >= targetTimestamp) {
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  // Calcular minutos y segundos
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const isExpired = timeRemaining === 0;

  return {
    minutes,
    seconds,
    isExpired,
  };
}
