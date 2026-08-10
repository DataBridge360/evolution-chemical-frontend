import type { SamplingPoint } from './types';

export const DEFAULT_ANALYSIS_TEXT =
  'Determinación de TSS x NACE 173 e Hidrocarburos totales por EPA 418.1';

export const EMPTY_SAMPLING_POINT: SamplingPoint = {
  name: '',
  tss: '',
  hct: '',
  h2s: '',
  co2: '',
};

export const OILFIELD_NAMES: Record<string, string> = {
  SCH: 'Sierra Chata',
  EMA: 'El Mangrullo',
};

export const METADATA_LABELS: Record<string, string> = {
  oilfield: 'Yacimiento',
  localidad: 'Localidad',
  plant: 'Planta',
  origin: 'Procedencia',
  sample_date: 'Fecha de muestreo',
  sample_time: 'Hora',
  report_date: 'Fecha de informe',
  report_number: 'N° Informe',
  pdt: 'PDT',
  sample_description: 'Muestra de',
  extracted_by: 'Extraída por',
  requested_by: 'Solicitado por',
  requested_analysis: 'Análisis requerido',
  laboratory: 'Laboratorio',
};
