/**
 * Constants for FQ Type A historico display.
 * Mirrors the backend constants.py to ensure consistent column order and headers.
 */

import type { HistoricFQTypeARecord } from './types';

/**
 * Ordered list of parameter field names matching the historico Excel template
 * columns I through BJ.
 */
export const HISTORICO_COLUMN_ORDER: (keyof HistoricFQTypeARecord)[] = [
  'pressure',
  'temperature',
  'conductivity',
  'resistivity',
  'ph',
  'density',
  'chlorides',
  'tds',
  'arsenic',
  'barium',
  'cadmium',
  'chromium_total',
  'chromium_hexavalent',
  'chromium_trivalent',
  'mercury',
  'lead',
  'hydrocarbons',
  'fats_and_oils',
  'benzene',
  'toluene',
  'ethylbenzene',
  'mp_xylenes',
  'o_xylene',
  'settleable_solids_10min',
  'settleable_solids_2h',
  'detergents_saam',
  'phenolic_substances',
  'bicarbonates',
  'carbonates',
  'sulfates',
  'calcium_hardness',
  'total_hardness',
  'cyanides',
  'fluorides',
  'nitrates',
  'nitrites',
  'calcium',
  'iron',
  'total_phosphorus',
  'manganese',
  'sodium',
  'aluminum',
  'copper',
  'magnesium',
  'nickel',
  'potassium',
  'vanadium',
  'zinc',
  'strontium',
  'tss',
  'dissolved_co2',
  'dissolved_o2',
  'dissolved_sh2',
  'incrustation_residual',
];

/**
 * Display headers for each parameter column, matching the reference template exactly.
 */
export const HISTORICO_COLUMN_HEADERS: Record<string, string> = {
  pressure: 'Presion [psi]',
  temperature: 'Temp. \u00b0C',
  conductivity: 'Cond. (\u00b5S/cm)',
  resistivity: 'Resist. (\u03a9/m)',
  ph: 'pH',
  density: 'Densidad (g/ml)',
  chlorides: 'Cl- (mg/lt)',
  tds: 'STD (mg/lt)',
  arsenic: 'As (mg/lt)',
  barium: 'Ba (mg/lt)',
  cadmium: 'Cd (mg/lt)',
  chromium_total: 'Cr total (mg/lt)',
  chromium_hexavalent: 'Cr hex. (mg/lt)',
  chromium_trivalent: 'Cr triv. (mg/lt)',
  mercury: 'Hg (mg/lt)',
  lead: 'Pb (mg/lt)',
  hydrocarbons: 'HC (mg/lt)',
  fats_and_oils: 'Grasas (mg/lt)',
  benzene: 'Benceno (mg/lt)',
  toluene: 'Tolueno (mg/lt)',
  ethylbenzene: 'Etilbenceno (mg/lt)',
  mp_xylenes: 'm,p-xilenos (mg/lt)',
  o_xylene: 'o-xileno (mg/lt)',
  settleable_solids_10min: "Sed. 10' (ml/l)",
  settleable_solids_2h: 'Sed. 2h (ml/l)',
  detergents_saam: 'Det. SAAM (mg/lt)',
  phenolic_substances: 'Fenoles (mg/lt)',
  bicarbonates: 'HCO3 (mg/lt)',
  carbonates: 'CO3 (mg/lt)',
  sulfates: 'SO4 (mg/lt)',
  calcium_hardness: 'Dur. Ca (CO3Ca)',
  total_hardness: 'Dur. total (CO3Ca)',
  cyanides: 'CN (mg/lt)',
  fluorides: 'F (mg/lt)',
  nitrates: 'NO3 (mg/lt)',
  nitrites: 'NO2 (mg/lt)',
  calcium: 'Ca (mg/lt)',
  iron: 'Fe (mg/lt)',
  total_phosphorus: 'P total (mg/lt)',
  manganese: 'Mn (mg/lt)',
  sodium: 'Na (mg/lt)',
  aluminum: 'Al (mg/lt)',
  copper: 'Cu (mg/lt)',
  magnesium: 'Mg (mg/lt)',
  nickel: 'Ni (mg/lt)',
  potassium: 'K (mg/lt)',
  vanadium: 'V (mg/lt)',
  zinc: 'Zn (mg/lt)',
  strontium: 'Sr (mg/lt)',
  tss: 'TSS (mg/lt)',
  dissolved_co2: 'CO2 dis. (mg/lt)',
  dissolved_o2: 'O2 dis. (ppb)',
  dissolved_sh2: 'SH2 dis. (mg/lt)',
  incrustation_residual: 'Res. Incrust. (mg/lt)',
};

/**
 * Metadata columns (frozen left side of the table).
 * `w` is the pixel width, `left` is precomputed cumulative offset for sticky positioning.
 */
export interface MetadataColumn {
  key: keyof HistoricFQTypeARecord;
  label: string;
  w: number;
  left: number;
}

const _META_DEFS: { key: keyof HistoricFQTypeARecord; label: string; w: number }[] = [
  { key: 'oilfield', label: 'Yacimiento', w: 100 },
  { key: 'plant', label: 'Planta', w: 70 },
  { key: 'equipment', label: 'Equipo', w: 75 },
  { key: 'sample_date', label: 'Fecha de Muestreo', w: 80 },
  { key: 'report_date', label: 'Fecha de Informe', w: 80 },
  { key: 'report_number', label: 'Numero de Informe', w: 80 },
  { key: 'sample_description', label: 'Descripcion de Muestra', w: 80 },
  { key: 'laboratory', label: 'Laboratorio', w: 80 },
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
