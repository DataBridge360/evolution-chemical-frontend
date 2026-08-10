/**
 * Constants for Water Historic display.
 * Columns I-O from the reference Excel template.
 */

import type { WaterHistoricRecord } from './types';

/**
 * Ordered list of parameter field names matching the historico Excel columns I-O.
 */
export const WATER_COLUMN_ORDER: (keyof WaterHistoricRecord)[] = [
  'tss',
  'hct',
  'o2_dissolved',
  'co2_dissolved',
  'h2s_dissolved',
  'incrustation_residual',
  'observations',
];

/**
 * Display headers for each parameter column.
 */
export const WATER_COLUMN_HEADERS: Record<string, string> = {
  tss: 'TSS [mg/l]',
  hct: 'HcT EPA 418.1 (mg/l)',
  o2_dissolved: 'O2 Disuelto (mg/L)',
  co2_dissolved: 'CO2 Disuelto (mg/L)',
  h2s_dissolved: 'H2S Disuelto (mg/L)',
  incrustation_residual: 'Residual Incrust. (mg/L)',
  observations: 'Observaciones',
};

/** Number of TSS+HcT columns */
export const TSS_HCT_COUNT = 2;

/** Number of dissolved gases columns */
export const GASES_COUNT = 3;

/** Number of "otros" columns (residual + observations) */
export const OTROS_COUNT = 2;

/**
 * Metadata columns (frozen left side of the table).
 */
export interface MetadataColumn {
  key: keyof WaterHistoricRecord;
  label: string;
  w: number;
  left: number;
}

const _META_DEFS: { key: keyof WaterHistoricRecord; label: string; w: number }[] = [
  { key: 'oilfield', label: 'Yacimiento', w: 100 },
  { key: 'plant', label: 'Planta', w: 90 },
  { key: 'equipment', label: 'Equipo', w: 110 },
  { key: 'sample_date', label: 'Fecha de Muestreo', w: 90 },
  { key: 'report_date', label: 'Fecha de Informe', w: 90 },
  { key: 'report_number', label: 'Numero de Informe', w: 90 },
  { key: 'sample_description', label: 'Descripcion de Muestra', w: 80 },
  { key: 'laboratory', label: 'Laboratorio', w: 100 },
];

export const METADATA_COLUMNS: MetadataColumn[] = (() => {
  let offset = 0;
  return _META_DEFS.map((col) => {
    const result = { ...col, left: offset };
    offset += col.w;
    return result;
  });
})();

/** Total pixel width of all frozen metadata columns */
export const FROZEN_WIDTH = METADATA_COLUMNS.reduce((sum, c) => sum + c.w, 0);
