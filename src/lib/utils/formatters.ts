import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
};

export const formatDateTime = (date: string | Date) => {
  return format(new Date(date), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
};

export const formatRelativeDate = (date: string | Date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
  return formatDate(date);
};
