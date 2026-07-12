/**
 * Type definitions for Historic FQ Type A (physicochemical water analysis).
 */

export type Oilfield = 'SCH' | 'EMA';

export interface HistoricFQTypeARecord {
  id: string;
  company_id: string | null;
  company_name: string;
  oilfield: string;
  plant: string | null;
  equipment: string | null;
  sample_date: string | null;
  report_date: string | null;
  report_number: string | null;
  sample_description: string;
  laboratory: string | null;
  localidad: string;
  pdt: string | null;

  // Physicochemical parameters (all stored as text)
  pressure: string | null;
  temperature: string | null;
  conductivity: string | null;
  resistivity: string | null;
  ph: string | null;
  density: string | null;
  chlorides: string | null;
  tds: string | null;
  arsenic: string | null;
  barium: string | null;
  cadmium: string | null;
  chromium_total: string | null;
  chromium_hexavalent: string | null;
  chromium_trivalent: string | null;
  mercury: string | null;
  lead: string | null;
  hydrocarbons: string | null;
  fats_and_oils: string | null;
  benzene: string | null;
  toluene: string | null;
  ethylbenzene: string | null;
  mp_xylenes: string | null;
  o_xylene: string | null;
  settleable_solids_10min: string | null;
  settleable_solids_2h: string | null;
  detergents_saam: string | null;
  phenolic_substances: string | null;
  bicarbonates: string | null;
  carbonates: string | null;
  sulfates: string | null;
  calcium_hardness: string | null;
  total_hardness: string | null;
  cyanides: string | null;
  fluorides: string | null;
  nitrates: string | null;
  nitrites: string | null;
  calcium: string | null;
  iron: string | null;
  total_phosphorus: string | null;
  manganese: string | null;
  sodium: string | null;
  aluminum: string | null;
  copper: string | null;
  magnesium: string | null;
  nickel: string | null;
  potassium: string | null;
  vanadium: string | null;
  zinc: string | null;
  strontium: string | null;
  tss: string | null;
  dissolved_co2: string | null;
  dissolved_o2: string | null;
  dissolved_sh2: string | null;
  incrustation_residual: string | null;

  source_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadHistoricMetadata {
  company_id: string;
  oilfield: Oilfield;
  localidad: string;
  plant: string;
  equipment: string;
}

export interface HistoricFQTypeAFilters {
  company_id?: string;
  oilfield?: string;
  localidad?: string;
}
