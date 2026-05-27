export interface Analysis {
  analysis_id: string;
  sample_id: string;
  analysis_date: string;
  analysis_performed: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnalysisDto {
  analysis_performed: string;
  observations?: string;
  analysis_date?: string;
}

// Type matching Django backend serializer
export interface AnalysisWithDetails extends Analysis {
  // Sample fields (from backend)
  internal_code: string;
  sample_type: string;
  sample_date: string;
  contact_email: string;
  requested_analysis: string;
  status: string;

  // Company fields (from backend)
  company_id: string;
  company_name: string;
}
