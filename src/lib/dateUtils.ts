/**
 * Utilidades para manejar fechas y horas en zona horaria de Argentina
 */

const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Formatea una fecha a formato corto (dd/MM/yyyy) en hora de Argentina
 */
export function formatDateAR(date: string | Date): string {
  let dateObj: Date;

  if (typeof date === 'string') {
    // Si es una fecha sin hora (formato YYYY-MM-DD), parsearla como fecha local
    // para evitar problemas de timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Formatea una fecha con hora (dd/MM/yyyy HH:mm) en hora de Argentina
 */
export function formatDateTimeAR(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dateObj);
}

/**
 * Formatea una fecha con hora completa (dd/MM/yyyy HH:mm:ss) en hora de Argentina
 */
export function formatDateTimeFullAR(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(dateObj);
}

/**
 * Obtiene la fecha y hora actual en Argentina
 */
export function getNowAR(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
}
