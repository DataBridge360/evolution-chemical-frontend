// Tipo de muestra
export interface Muestra {
  sample_id: string;
  company_id: string;
  internal_code: string | null;
  sample_type: string;
  sample_date: string;
  contact_email: string;
  requested_analysis: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export enum SampleStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const statusLabels: Record<SampleStatus, string> = {
  [SampleStatus.PENDING]: 'Pendiente',
  [SampleStatus.IN_PROGRESS]: 'En Proceso',
  [SampleStatus.COMPLETED]: 'Completado',
  [SampleStatus.CANCELLED]: 'Cancelado',
};

export const statusColors: Record<SampleStatus, string> = {
  [SampleStatus.PENDING]: 'bg-orange-50 text-orange-700 border-orange-200',
  [SampleStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 border-blue-200',
  [SampleStatus.COMPLETED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [SampleStatus.CANCELLED]: 'bg-gray-50 text-gray-600 border-gray-200',
};
