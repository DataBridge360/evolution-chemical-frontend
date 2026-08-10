/**
 * Type definitions for Water Historic (TSS, HcT, dissolved gases, residual).
 */

export type Oilfield = 'SCH' | 'EMA';

export interface WaterHistoricRecord {
  id: string;
  company_id: string;
  oilfield: string;
  plant: string;
  equipment: string;
  sample_date: string | null;
  report_date: string | null;
  report_number: string;
  sample_description: string;
  laboratory: string;

  // Parameters (columns I-O in the historico Excel)
  tss: number | null;
  hct: number | null;
  o2_dissolved: number | null;
  co2_dissolved: number | null;
  h2s_dissolved: number | null;
  incrustation_residual: number | null;
  observations: string | null;

  // Traceability
  source_report_type: string;
  source_report_id: string | null;
  source_result_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface WaterHistoricFilters {
  company_id?: string;
  oilfield?: string;
}

export interface PaginatedWaterHistoricResponse {
  data: WaterHistoricRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
