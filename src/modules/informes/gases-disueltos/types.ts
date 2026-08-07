import { z } from 'zod';

export interface GasSamplingPoint {
  plant: string; // grupo/planta (ej. "PAD 5") — se combina verticalmente en el Excel
  name: string; // punto de muestreo (ej. "POZO 1013")
  co2: string;
  h2s: string;
  o2: string;
}

const gasSamplingPointSchema = z.object({
  plant: z.string().optional().default(''),
  name: z.string().min(1, 'Nombre requerido'),
  co2: z.string().optional().default(''),
  h2s: z.string().optional().default(''),
  o2: z.string().optional().default(''),
});

export const gasesDisueltosReportSchema = z.object({
  company_id: z.string().min(1, 'Seleccioná una empresa'),
  oilfield: z.string().min(1, 'Seleccioná un yacimiento'),
  localidad: z.string().optional().default(''),
  plant: z.string().optional().default(''), // planta general del encabezado
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
    .default('Determinación de gases in situ con kit CHEMets'),
  laboratory: z.string().optional().default('Evolution Chemical'),

  sampling_points: z.array(gasSamplingPointSchema).min(1, 'Agregá al menos un punto de muestreo'),
});

export type GasesDisueltosReportFormData = z.infer<typeof gasesDisueltosReportSchema>;

export interface GasesDisueltosReportRecord {
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
  sampling_points: string; // JSON string of GasSamplingPoint[]
  created_by?: string;
  created_at: string;
  updated_at: string;
}
