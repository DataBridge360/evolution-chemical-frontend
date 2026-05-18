export interface SampleResult {
  sample_result_id: string;
  sample_id: string;
  analysis_date: string;
  analysis_performed: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSampleResultDto {
  analysis_performed: string;
  observations?: string;
  analysis_date?: string;
}

// Tipo actualizado para coincidir con el backend Django
export interface SampleResultWithDetails extends SampleResult {
  // Sample fields (directos del backend)
  internal_code: string;
  sample_type: string;
  sample_date: string;
  contact_email: string;
  requested_analysis: string;
  status: string;

  // Company fields (directos del backend)
  company_id: string;
  company_name: string;
}
