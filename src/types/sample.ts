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
  // Campo virtual con nombre de compañía
  company_name?: string;
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
