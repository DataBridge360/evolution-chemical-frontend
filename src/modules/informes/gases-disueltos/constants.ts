import type { GasSamplingPoint } from './types';

export const DEFAULT_ANALYSIS_TEXT = 'Determinación de gases in situ con kit CHEMets';

export const EMPTY_GAS_SAMPLING_POINT: GasSamplingPoint = {
  plant: '',
  name: '',
  co2: '',
  h2s: '',
  o2: '',
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
