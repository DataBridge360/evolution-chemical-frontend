export interface ReportParameter {
  fieldName: string;
  label: string;
  unit: string;
  method: string;
}

// ── Determinaciones In-Situ (rows 20-24 in Excel) ──────────────────────────

export const IN_SITU_PARAMETERS: ReportParameter[] = [
  { fieldName: 'ph', label: 'pH', unit: '', method: 'SM 4500H-B' },
  { fieldName: 'temperature', label: 'Temperatura', unit: 'C', method: 'SM 2550 b' },
  { fieldName: 'density', label: 'Densidad', unit: 'gr/cm3', method: 'SM' },
  { fieldName: 'conductivity', label: 'Conductividad', unit: 'uS/cm', method: 'API RP-45' },
  { fieldName: 'resistivity', label: 'Resistividad', unit: 'Ohm.cm', method: 'API RP-45' },
];

// ── Caracteres Físico Químicos (rows 28-71 in Excel) ────────────────────────

export const CHEMICAL_PARAMETERS: ReportParameter[] = [
  { fieldName: 'chlorides', label: 'Cloruros Cl', unit: 'mg/L', method: 'SM 4500 Cl-' },
  { fieldName: 'tds', label: 'Total de Sales Disueltas TDS', unit: 'mg/L', method: 'API RP-45' },
  {
    fieldName: 'arsenic',
    label: 'Arsénico As',
    unit: 'mg/L',
    method: 'SW846 AA - Generación hidruros',
  },
  { fieldName: 'barium', label: 'Bario Ba', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'cadmium', label: 'Cadmio Cd', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'chromium_total', label: 'Cromo Total Cr', unit: 'mg/L', method: 'SW846 AA' },
  {
    fieldName: 'chromium_hexavalent',
    label: 'Cromo Hexavalente Cr+6',
    unit: 'mg/L',
    method: 'SM 3500 Cr',
  },
  {
    fieldName: 'chromium_trivalent',
    label: 'Cromo Trivalente Cr+3',
    unit: 'mg/L',
    method: 'SM 3500 Cr',
  },
  {
    fieldName: 'mercury',
    label: 'Mercurio Hg',
    unit: 'mg/L',
    method: 'SW846 AA - Generación hidruros',
  },
  { fieldName: 'lead', label: 'Plomo Pb', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'hydrocarbons', label: 'Hidrocarburos', unit: 'mg/L', method: 'EPA 5021' },
  { fieldName: 'fats_and_oils', label: 'Grasas y Aceites', unit: 'mg/L', method: 'EPA 418.1' },
  { fieldName: 'benzene', label: 'Benceno', unit: 'mg/L', method: 'EPA 5021' },
  { fieldName: 'toluene', label: 'Tolueno', unit: 'mg/L', method: 'EPA 5021' },
  { fieldName: 'ethylbenzene', label: 'Etilbenceno', unit: 'mg/L', method: 'EPA 5021' },
  { fieldName: 'mp_xylenes', label: 'm.p Xilenos', unit: 'mg/L', method: 'EPA 5021' },
  { fieldName: 'o_xylene', label: 'o-Xileno', unit: 'mg/L', method: 'EPA 5021' },
  {
    fieldName: 'settleable_solids_10min',
    label: "Sólidos sedimentables 10'",
    unit: 'ml/L',
    method: 'SM 2540 F',
  },
  {
    fieldName: 'settleable_solids_2h',
    label: 'Sólidos sedimentables 2 h',
    unit: 'ml/L',
    method: 'SM 2540 F',
  },
  { fieldName: 'detergents_saam', label: 'Detergentes SAAM', unit: 'mg/L', method: 'SM 5540' },
  {
    fieldName: 'phenolic_substances',
    label: 'Sustancias Fenólicas',
    unit: 'mg/L',
    method: 'SM 5530',
  },
  { fieldName: 'bicarbonates', label: 'Bicarbonatos HCO3-', unit: 'mg/L', method: 'API RP-45' },
  { fieldName: 'carbonates', label: 'Carbonatos CO3=', unit: 'mg/L', method: 'API RP-45' },
  { fieldName: 'sulfates', label: 'Sulfatos SO4=', unit: 'mg/L', method: 'API RP-45' },
  {
    fieldName: 'calcium_hardness',
    label: 'Dureza Cálcica CO3Ca2',
    unit: 'mg/L',
    method: 'ASTM D1126',
  },
  {
    fieldName: 'total_hardness',
    label: 'Dureza Total CO3Ca2 - CO3Mg2',
    unit: 'mg/L',
    method: 'ASTM D1126',
  },
  { fieldName: 'cyanides', label: 'Cianuros CN-', unit: 'mg/L', method: 'SM 4500 CN-' },
  { fieldName: 'fluorides', label: 'Fluoruros F-', unit: 'mg/L', method: 'SM 4500 F A' },
  { fieldName: 'nitrates', label: 'Nitratos NO3-', unit: 'mg/L', method: 'SM 4500' },
  { fieldName: 'nitrites', label: 'Nitritos NO2-', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'calcium', label: 'Calcio Ca', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'iron', label: 'Hierro FeT', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'total_phosphorus', label: 'Fósforo Total P', unit: 'mg/L', method: 'SM 4500 P' },
  { fieldName: 'manganese', label: 'Manganeso Mn', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'sodium', label: 'Sodio Na', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'aluminum', label: 'Aluminio Al', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'copper', label: 'Cobre Cu', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'magnesium', label: 'Magnesio Mg', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'nickel', label: 'Níquel Ni', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'potassium', label: 'Potasio K', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'vanadium', label: 'Vanadio V', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'zinc', label: 'Zinc Zn', unit: 'mg/L', method: 'SW846 AA' },
  { fieldName: 'strontium', label: 'Estroncio Sr', unit: 'mg/L', method: 'SW846 AA' },
  {
    fieldName: 'tss',
    label: 'Total de sólidos en suspensión',
    unit: 'mg/L',
    method: 'NACE TM 173',
  },
  { fieldName: 'dissolved_co2', label: 'CO2 Disuelto', unit: 'mg/L', method: '' },
  { fieldName: 'dissolved_o2', label: 'O2 Disuelto', unit: 'ppb', method: '' },
  { fieldName: 'dissolved_sh2', label: 'SH2 Disuelto', unit: 'mg/L', method: '' },
  {
    fieldName: 'incrustation_residual',
    label: 'Residual de Incrustación',
    unit: 'mg/L',
    method: '',
  },
];

export const ALL_PARAMETERS: ReportParameter[] = [...IN_SITU_PARAMETERS, ...CHEMICAL_PARAMETERS];

/** Default units keyed by fieldName. Used to pre-populate the form. */
export function getDefaultUnits(): Record<string, string> {
  const units: Record<string, string> = {};
  for (const p of ALL_PARAMETERS) {
    units[p.fieldName] = p.unit;
  }
  return units;
}

/** Default methods keyed by fieldName. Used to pre-populate the form. */
export function getDefaultMethods(): Record<string, string> {
  const methods: Record<string, string> = {};
  for (const p of ALL_PARAMETERS) {
    methods[p.fieldName] = p.method;
  }
  return methods;
}

// ── Metadata field labels ───────────────────────────────────────────────────

export const METADATA_LABELS: Record<string, string> = {
  oilfield: 'Yacimiento',
  localidad: 'Localidad',
  plant: 'Planta',
  equipment: 'Equipo',
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
