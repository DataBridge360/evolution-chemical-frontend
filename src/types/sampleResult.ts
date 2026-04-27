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

export interface SampleResultWithDetails extends SampleResult {
  samples: {
    sample_id: string;
    internal_code: string;
    sample_type: string;
    sample_date: string;
    company_id: string;
    companies: {
      company_id: string;
      name: string;
    };
  };
}
