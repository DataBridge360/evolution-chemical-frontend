export enum SampleStatus {
  PENDIENTE = 'pendiente',
  LISTO = 'listo',
}

export enum SampleType {
  SOLIDO = 'solido',
  AGUA = 'agua',
  PETROLEO = 'petroleo',
  PROD_QCO = 'prod_qco',
  OTRO = 'otro',
}

export interface Sample {
  sample_id: string;
  company_id: string;
  internal_code: string | null;
  sample_type: string;
  sample_date: string;
  contact_email: string;
  requested_analysis: string;
  status: SampleStatus;
  created_at: string;
  updated_at: string;
  // Campos virtuales del backend
  company_name?: string;
  can_view_results?: boolean;
  // Papelera (presentes cuando la muestra está en la papelera)
  deleted_at?: string | null;
  deleted_by_name?: string | null;
}

export interface CreateSampleDto {
  company_id: string;
  // client_name se obtiene automáticamente del company_id
  sample_type: SampleType;
  sample_type_other?: string;
  sample_date: string;
  contact_email: string;
  requested_analysis: string;
}

export interface PaginatedSamplesResponse {
  data: Sample[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
