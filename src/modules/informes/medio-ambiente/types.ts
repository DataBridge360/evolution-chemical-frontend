import { z } from 'zod';

/**
 * Each parameter is stored in the DB as a JSON string:
 * {"value": "9.81", "unit": "mg/L", "method": "SM 4500H-B"}
 */
export interface ParameterData {
  value: string;
  unit: string;
  method: string;
}

export const environmentReportSchema = z.object({
  // Metadata
  company_id: z.string().min(1, 'Seleccioná una empresa'),
  oilfield: z.string().min(1, 'Seleccioná un yacimiento'),
  localidad: z.string().optional().default(''),
  plant: z.string().min(1, 'Requerido'),
  equipment: z.string().min(1, 'Requerido'),
  origin: z.string().min(1, 'Requerido'),
  sample_date: z.string().min(1, 'Requerido'),
  sample_time: z.string().optional().default(''),
  report_date: z.string().min(1, 'Requerido'),
  report_number: z.string().min(1, 'Requerido'),
  pdt: z.string().optional().default(''),
  sample_description: z.string().optional().default('Agua'),
  extracted_by: z.string().optional().default(''),
  requested_by: z.string().optional().default(''),
  requested_analysis: z
    .string()
    .optional()
    .default('Analisis completo de agua bajo normas NACE, EPA, ASTM y SM'),
  laboratory: z.string().optional().default('Evolution Chemical'),

  // In-situ parameters
  ph: z.string().optional().default(''),
  temperature: z.string().optional().default(''),
  density: z.string().optional().default(''),
  conductivity: z.string().optional().default(''),
  resistivity: z.string().optional().default(''),

  // Chemical parameters
  chlorides: z.string().optional().default(''),
  tds: z.string().optional().default(''),
  arsenic: z.string().optional().default(''),
  barium: z.string().optional().default(''),
  cadmium: z.string().optional().default(''),
  chromium_total: z.string().optional().default(''),
  chromium_hexavalent: z.string().optional().default(''),
  chromium_trivalent: z.string().optional().default(''),
  mercury: z.string().optional().default(''),
  lead: z.string().optional().default(''),
  hydrocarbons: z.string().optional().default(''),
  fats_and_oils: z.string().optional().default(''),
  benzene: z.string().optional().default(''),
  toluene: z.string().optional().default(''),
  ethylbenzene: z.string().optional().default(''),
  mp_xylenes: z.string().optional().default(''),
  o_xylene: z.string().optional().default(''),
  settleable_solids_10min: z.string().optional().default(''),
  settleable_solids_2h: z.string().optional().default(''),
  detergents_saam: z.string().optional().default(''),
  phenolic_substances: z.string().optional().default(''),
  bicarbonates: z.string().optional().default(''),
  carbonates: z.string().optional().default(''),
  sulfates: z.string().optional().default(''),
  calcium_hardness: z.string().optional().default(''),
  total_hardness: z.string().optional().default(''),
  cyanides: z.string().optional().default(''),
  fluorides: z.string().optional().default(''),
  nitrates: z.string().optional().default(''),
  nitrites: z.string().optional().default(''),
  calcium: z.string().optional().default(''),
  iron: z.string().optional().default(''),
  total_phosphorus: z.string().optional().default(''),
  manganese: z.string().optional().default(''),
  sodium: z.string().optional().default(''),
  aluminum: z.string().optional().default(''),
  copper: z.string().optional().default(''),
  magnesium: z.string().optional().default(''),
  nickel: z.string().optional().default(''),
  potassium: z.string().optional().default(''),
  vanadium: z.string().optional().default(''),
  zinc: z.string().optional().default(''),
  strontium: z.string().optional().default(''),
  tss: z.string().optional().default(''),
  dissolved_co2: z.string().optional().default(''),
  dissolved_o2: z.string().optional().default(''),
  dissolved_sh2: z.string().optional().default(''),
  incrustation_residual: z.string().optional().default(''),

  // Editable units and methods (kept in form state, serialized into params on submit)
  _units: z.record(z.string(), z.string()).optional().default({}),
  _methods: z.record(z.string(), z.string()).optional().default({}),
});

export type EnvironmentReportFormData = z.infer<typeof environmentReportSchema>;

export interface EnvironmentReportRecord extends EnvironmentReportFormData {
  id: string;
  company_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
