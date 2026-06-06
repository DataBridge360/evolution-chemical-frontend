/**
 * Tipos para el módulo de cromatografía
 */

export type AnalysisStatus = 'draft' | 'calculated' | 'approved' | 'reported';

export type ReportType = 'extended' | 'simple' | 'extended_xl';

export interface Composition {
  [compoundCode: string]: number;
}

export interface CompoundData {
  code: string;
  name: string;
  formula: string;
  order: number;
  // Porcentajes básicos
  pct_molar: number;
  fracc_molar: number;
  pct_volumen: number;
  pct_masa: number;
  // Factores de contribución
  fc_pct_vol: number;
  fc_pct_masa: number;
  fc_suma_k: number;
  k: number;
  // Propiedades del compuesto puro
  z_puro: number;
  masa_molar: number; // Contribución a masa molecular
  masa_molar_pura: number; // Masa molecular del compuesto puro
  // Propiedades energéticas
  pcs: number; // PCS puro
  pci: number; // PCI puro
  pcs_mezcla: number; // Contribución PCS
  pci_mezcla: number; // Contribución PCI
  densidad_relativa: number; // Contribución densidad relativa
  // Propiedades críticas
  tc: number; // Tc puro (K)
  pc: number; // Pc puro (kPa)
  tc_contrib: number; // Contribución Tc pseudocrítica
  pc_contrib: number; // Contribución Pc pseudocrítica
  // Volumen crítico
  vc_spec: number; // Vci específico (m³/kg)
  vc_molar: number; // Vci molar (m³/kmol)
  zc: number; // Zci
  zc_contrib: number; // Contribución Zcm
  vc_contrib: number; // Contribución Vcm
  // Puntos de cambio de fase
  t_solid: number; // Temperatura solidificación (°C)
  t_boil: number; // Temperatura ebullición (°C)
  t_solid_contrib: number; // Contribución freezing point
  t_boil_contrib: number; // Contribución boiling point
  // Volumen líquido equivalente
  m3_gas_m3_liq: number;
  vol_liq_eq: number; // Contribución vol líquido eq
  // Composición atómica
  n_carbon: number; // Contribución carbono
  n_hydrogen: number; // Contribución hidrógeno
  n_oxygen: number; // Contribución oxígeno
  n_nitrogen: number; // Contribución nitrógeno
  // Combustión
  aire_req: number; // Aire requerido puro
  aire_req_contrib: number; // Contribución aire req
  lfl: number; // LFL puro
  ufl: number; // UFL puro
  lfl_contrib: number; // Contribución LFL
  ufl_contrib: number; // Contribución UFL
  // Calores específicos
  cp_puro: number;
  cv_puro: number;
  cp_mezcla: number; // Contribución Cp
  cv_mezcla: number; // Contribución Cv
  // Relación H/C
  hc_ratio: number; // Ratio H/C puro
  hc_ratio_contrib: number; // Contribución ratio H/C
}

export interface PropertyValue {
  value: number;
  unit: string;
}

export interface CustomDataField {
  name: string;
  value: string;
  unit: string;
}

export interface CalculatedProperties {
  input: {
    presion_kpa: number;
    temp_c: number;
    descuento_o2_n2_aplicado: boolean;
    descuento_pct: number | null;
  };
  composicion: CompoundData[];
  totales: {
    pct_molar: number;
    pct_volumen: number;
    pct_masa: number;
  };
  caracteristicas_generales: {
    masa_molecular: PropertyValue;
    volumen_molar: PropertyValue;
    densidad_relativa: PropertyValue;
    densidad_absoluta: PropertyValue;
    pcs: PropertyValue;
    pci: PropertyValue;
    f_compresibilidad: PropertyValue;
    indice_wobbe: PropertyValue;
    viscosidad_dean_stiel?: PropertyValue;
    viscosidad_lucas?: PropertyValue;
  };
  propiedades_criticas: {
    tc: {
      value_k: number;
      value_c: number;
    };
    tc_corr: {
      value_k: number;
      value_c: number;
    };
    pc: {
      value_kpa: number;
      value_kg_cm2: number;
    };
    pc_corr: {
      value_kpa: number;
      value_kg_cm2: number;
    };
    vc: PropertyValue;
    zc: PropertyValue;
    t_congelamiento: {
      value_k: number;
      value_c: number;
    };
    t_ebullicion: {
      value_k: number;
      value_c: number;
    };
    tr: number;
    pr: number;
  };
  volumen_liquido_eq: {
    c1_plus: number;
    c2_plus: number;
    c3_plus: number;
    c4_plus: number;
    c5_plus: number;
    unit: string;
  };
  composicion_porcentual: {
    oxigeno: number;
    nitrogeno: number;
    carbono: number;
    hidrogeno: number;
    ratio_c_h: number;
  };
  otros_datos: {
    aire_combustion: PropertyValue;
    lfl: PropertyValue;
    ufl: PropertyValue;
    lfl_fracc_molar: number;
    ufl_fracc_molar: number;
    cp_kj_kg_k: number;
    cv_kj_kg_k: number;
    cp_kcal_kg_c: number;
    cv_kcal_kg_c: number;
    cp_kcal_m3_c: number;
    cv_kcal_m3_c: number;
    k_cp_cv: number;
    _custom?: CustomDataField[];
  };
  numero_metano: {
    mon: number;
    mn: number;
  };
}

export interface ChromatographicAnalysis {
  analysis_id: string;
  sample?: string;
  company?: string;
  report_number?: string;
  company_name: string;
  field_name?: string;
  well_name?: string;
  sample_point?: string;
  sample_date?: string;
  analysis_date?: string;
  operating_pressure_kpa?: number;
  operating_temperature_c?: number;
  flow_rate?: number;
  flow_rate_unit?: string;

  chromatograph_sample_name?: string;
  chromatograph_data_file?: string;
  chromatograph_instrument?: string;
  chromatograph_operator?: string;
  chromatograph_injection_date?: string;

  xlsx_file?: string;
  composition: Composition;

  apply_o2_n2_discount: boolean;
  discount_percentage: number;
  include_viscosities: boolean;

  // Campos editables adicionales
  h2s_content?: string; // Contenido de H2S en ppm,v

  calculated_properties?: CalculatedProperties;
  chroma_report_html?: string;
  status: AnalysisStatus;

  created_at: string;
  updated_at: string;
}

export interface AnalysisReport {
  report_id: string;
  analysis: string;
  report_type: ReportType;
  file: string;
  generated_at: string;
  generated_by?: string;
}

export interface UploadXLSXRequest {
  xlsx_file: File;
  company_id: string;
  field_name?: string;
  well_name?: string;
}

export interface UploadXLSXResponse {
  analysis_id: string;
  composition: Composition;
  metadata: {
    sample_name?: string;
    data_file?: string;
    instrument?: string;
    total_pct_molar: number;
    compounds_detected: number;
  };
  status: AnalysisStatus;
}

export interface CalculatePropertiesRequest {
  apply_o2_n2_discount?: boolean;
  discount_percentage?: number;
  include_viscosities?: boolean;
}

export interface GenerateReportRequest {
  report_type?: ReportType;
}
