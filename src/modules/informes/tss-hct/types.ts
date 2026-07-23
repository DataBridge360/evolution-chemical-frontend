import { z } from 'zod';

export interface SamplingPoint {
  name: string;
  tss: string;
  hct: string;
  h2s: string;
  co2: string;
}

const samplingPointSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  tss: z.string().optional().default(''),
  hct: z.string().optional().default(''),
  h2s: z.string().optional().default(''),
  co2: z.string().optional().default(''),
});

export const tssHctReportSchema = z.object({
  company_id: z.string().min(1, 'Seleccioná una empresa'),
  oilfield: z.string().min(1, 'Seleccioná un yacimiento'),
  localidad: z.string().optional().default(''),
  plant: z.string().min(1, 'Requerido'),
  origin: z.string().optional().default(''),
  sample_date: z.string().min(1, 'Requerido'),
  sample_time: z.string().optional().default(''),
  report_date: z.string().min(1, 'Requerido'),
  report_number: z.string().min(1, 'Requerido'),
  pdt: z.string().optional().default(''),
  sample_description: z.string().optional().default('Agua'),
  extracted_by: z.string().optional().default('Evolution Chemical SRL'),
  requested_by: z.string().optional().default(''),
  requested_analysis: z
    .string()
    .optional()
    .default('Determinación de TSS x NACE 173 e Hidrocarburos totales por EPA 418.1'),
  laboratory: z.string().optional().default('Evolution Chemical'),

  include_h2s: z.boolean().optional().default(false),
  include_co2: z.boolean().optional().default(false),

  sampling_points: z.array(samplingPointSchema).min(1, 'Agregá al menos un punto de muestreo'),
});

export type TssHctReportFormData = z.infer<typeof tssHctReportSchema>;

export interface TssHctReportRecord {
  id: string;
  company_id: string;
  oilfield: string;
  localidad: string;
  plant: string;
  origin: string;
  sample_date: string;
  sample_time: string;
  report_date: string;
  report_number: string;
  pdt: string;
  sample_description: string;
  extracted_by: string;
  requested_by: string;
  requested_analysis: string;
  laboratory: string;
  include_h2s: boolean;
  include_co2: boolean;
  sampling_points: string; // JSON string of SamplingPoint[]
  created_by?: string;
  created_at: string;
  updated_at: string;
}
