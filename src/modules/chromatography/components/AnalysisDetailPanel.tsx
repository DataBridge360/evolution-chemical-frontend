'use client';

import { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';

interface Props {
  analysisId: string;
  onClose: () => void;
}

// Helper para formatear números
const safeFormat = (value: number | undefined | null, decimals: number = 2): string => {
  if (value === 0) return value.toFixed(decimals);
  if (value === undefined || value === null || isNaN(value)) return '-';
  return value.toFixed(decimals);
};

// Componente para mostrar una propiedad con un solo valor
const PropertyRow = ({
  label,
  value,
  unit,
  decimals = 4,
}: {
  label: string;
  value: number | undefined | null;
  unit: string;
  decimals?: number;
}) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-100">
    <span className="text-gray-700 font-medium">{label}</span>
    <span className="text-gray-900 font-semibold">
      {safeFormat(value, decimals)} {unit}
    </span>
  </div>
);

// Componente para mostrar una propiedad con dos valores (ej: K y °C)
const ValueRow = ({
  label,
  value1,
  unit1,
  value2,
  unit2,
  decimals = 2,
}: {
  label: string;
  value1: number | undefined | null;
  unit1: string;
  value2: number | undefined | null;
  unit2: string;
  decimals?: number;
}) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-100">
    <span className="text-gray-700 font-medium">{label}</span>
    <span className="text-gray-900 font-semibold">
      {safeFormat(value1, decimals)} {unit1} / {safeFormat(value2, decimals)} {unit2}
    </span>
  </div>
);

export function AnalysisDetailPanel({ analysisId, onClose }: Props) {
  const { data: analysis, isLoading } = useAnalysis(analysisId);
  const [showReport, setShowReport] = useState(false);

  // Función para imprimir / guardar el informe HTML como PDF
  const handleDownloadReportPDF = () => {
    if (!analysis) return;

    // Guardar título original
    const originalTitle = document.title;

    // Cambiar título temporalmente para el nombre del PDF
    document.title = `Informe_${analysis.report_number || analysis.analysis_id}`;

    // Abrir diálogo de impresión (el usuario podrá elegir "Guardar como PDF")
    window.print();

    // Restaurar título original después de un breve delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
        <div className="fixed right-0 top-0 h-full w-3/4 bg-white shadow-2xl z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando análisis...</p>
          </div>
        </div>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
        <div className="fixed right-0 top-0 h-full w-3/4 bg-white shadow-2xl z-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">No se encontró el análisis</p>
            <button onClick={onClose} className="mt-4 bg-gray-600 text-white px-4 py-2 rounded">
              Cerrar
            </button>
          </div>
        </div>
      </>
    );
  }

  const props = analysis.calculated_properties;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel Principal - Resultados */}
      <div className="fixed right-0 top-0 h-full w-3/4 bg-gray-50 shadow-2xl z-50 overflow-y-auto">
        {/* Header Sticky */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análisis Cromatográfico</h2>
            <p className="text-gray-600">
              {analysis.company_name} {analysis.field_name && `- ${analysis.field_name}`}
            </p>
          </div>
          <div className="flex gap-2">
            {analysis.chroma_report_html && (
              <button
                onClick={() => setShowReport(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                📄 Ver Informe
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl px-3"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido - Implementación completa desde /cromatografia/[id]/page.tsx */}
        <div className="p-6">
          {!props ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-800">
                Este análisis aún no ha sido calculado. Las propiedades no están disponibles.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tabla de Composición Completa */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">Composición Detallada</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="sticky left-0 z-10 bg-gray-100 px-3 py-2 text-left font-semibold">
                          Compuesto
                        </th>
                        <th className="px-3 py-2 text-center font-semibold">Fórmula</th>
                        <th className="px-3 py-2 text-right font-semibold">% Molar</th>
                        <th className="px-3 py-2 text-right font-semibold">Fracc. Molar</th>
                        <th className="px-3 py-2 text-right font-semibold">% Vol</th>
                        <th className="px-3 py-2 text-right font-semibold">% Masa</th>
                        <th className="px-3 py-2 text-right font-semibold">M (kg/kmol)</th>
                        <th className="px-3 py-2 text-right font-semibold">Dens. Rel.</th>
                        <th className="px-3 py-2 text-right font-semibold">PCS</th>
                        <th className="px-3 py-2 text-right font-semibold">PCI</th>
                        <th className="px-3 py-2 text-right font-semibold">Tc (K)</th>
                        <th className="px-3 py-2 text-right font-semibold">Pc (kPa)</th>
                        <th className="px-3 py-2 text-right font-semibold">Vc</th>
                        <th className="px-3 py-2 text-right font-semibold">Zc</th>
                        <th className="px-3 py-2 text-right font-semibold">T Solid (°C)</th>
                        <th className="px-3 py-2 text-right font-semibold">T Boil (°C)</th>
                        <th className="px-3 py-2 text-right font-semibold">Vol Liq Eq</th>
                        <th className="px-3 py-2 text-right font-semibold">C</th>
                        <th className="px-3 py-2 text-right font-semibold">H</th>
                        <th className="px-3 py-2 text-right font-semibold">O</th>
                        <th className="px-3 py-2 text-right font-semibold">N</th>
                        <th className="px-3 py-2 text-right font-semibold">Aire Req</th>
                        <th className="px-3 py-2 text-right font-semibold">LFL</th>
                        <th className="px-3 py-2 text-right font-semibold">UFL</th>
                        <th className="px-3 py-2 text-right font-semibold">Cp</th>
                        <th className="px-3 py-2 text-right font-semibold">Cv</th>
                        <th className="px-3 py-2 text-right font-semibold">H/C Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {props.composicion
                        .filter((c) => c.name?.toUpperCase() !== 'TOTALES')
                        .map((compound, idx) => (
                          <tr key={idx} className="hover:bg-blue-50 transition-colors">
                            <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-gray-900">
                              {compound.name}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600">
                              {compound.formula}
                            </td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.pct_molar, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.fracc_molar, 6)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.pct_volumen, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.pct_masa, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.masa_molar, 4)}</td>
                            <td className="px-3 py-2 text-right">
                              {safeFormat(compound.densidad_relativa, 4)}
                            </td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.pcs_mezcla, 2)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.pci_mezcla, 2)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.tc_contrib, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.pc_contrib, 2)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.vc_contrib, 6)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.zc_contrib, 6)}</td>
                            <td className="px-3 py-2 text-right">
                              {safeFormat(compound.t_solid_contrib, 2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {safeFormat(compound.t_boil_contrib, 2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {safeFormat(compound.vol_liq_eq, 6)}
                            </td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.n_carbon, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.n_hydrogen, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.n_oxygen, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.n_nitrogen, 4)}</td>
                            <td className="px-3 py-2 text-right">
                              {safeFormat(compound.aire_req_contrib, 4)}
                            </td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.lfl_contrib, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.ufl_contrib, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.cp_mezcla, 4)}</td>
                            <td className="px-3 py-2 text-right">{safeFormat(compound.cv_mezcla, 4)}</td>
                            <td className="px-3 py-2 text-right">
                              {safeFormat(compound.hc_ratio_contrib, 4)}
                            </td>
                          </tr>
                        ))}

                      {/* Fila de Totales */}
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                        <td className="sticky left-0 z-10 bg-gray-100 px-3 py-2">TOTALES</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right">
                          {safeFormat(props.totales.pct_molar, 4)}
                        </td>
                        <td className="px-3 py-2 text-right">1.0000</td>
                        <td className="px-3 py-2 text-right">
                          {safeFormat(props.totales.pct_volumen, 4)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {safeFormat(props.totales.pct_masa, 4)}
                        </td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grid de Secciones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Características Generales */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
                    <h3 className="text-lg font-bold text-white">Características Generales</h3>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <PropertyRow
                      label="Masa Molecular"
                      value={props.caracteristicas_generales.masa_molecular.value}
                      unit={props.caracteristicas_generales.masa_molecular.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="Volumen Molar"
                      value={props.caracteristicas_generales.volumen_molar.value}
                      unit={props.caracteristicas_generales.volumen_molar.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="Densidad Relativa (Aire = 1)"
                      value={props.caracteristicas_generales.densidad_relativa.value}
                      unit={props.caracteristicas_generales.densidad_relativa.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="Densidad Absoluta"
                      value={props.caracteristicas_generales.densidad_absoluta.value}
                      unit={props.caracteristicas_generales.densidad_absoluta.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="PCS (Poder Calorífico Superior)"
                      value={props.caracteristicas_generales.pcs.value}
                      unit={props.caracteristicas_generales.pcs.unit}
                      decimals={2}
                    />
                    <PropertyRow
                      label="PCI (Poder Calorífico Inferior)"
                      value={props.caracteristicas_generales.pci.value}
                      unit={props.caracteristicas_generales.pci.unit}
                      decimals={2}
                    />
                    <PropertyRow
                      label="Factor de Compresibilidad (Z)"
                      value={props.caracteristicas_generales.f_compresibilidad.value}
                      unit={props.caracteristicas_generales.f_compresibilidad.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="Índice de Wobbe"
                      value={props.caracteristicas_generales.indice_wobbe.value}
                      unit={props.caracteristicas_generales.indice_wobbe.unit}
                      decimals={2}
                    />
                    {props.caracteristicas_generales.viscosidad_dean_stiel && (
                      <PropertyRow
                        label="Viscosidad (Dean-Stiel)"
                        value={props.caracteristicas_generales.viscosidad_dean_stiel.value}
                        unit={props.caracteristicas_generales.viscosidad_dean_stiel.unit}
                        decimals={6}
                      />
                    )}
                    {props.caracteristicas_generales.viscosidad_lucas && (
                      <PropertyRow
                        label="Viscosidad (Lucas)"
                        value={props.caracteristicas_generales.viscosidad_lucas.value}
                        unit={props.caracteristicas_generales.viscosidad_lucas.unit}
                        decimals={6}
                      />
                    )}
                  </div>
                </div>

                {/* Número de Metano */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
                    <h3 className="text-lg font-bold text-white">Número de Metano</h3>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <PropertyRow
                      label="MON (Motor Octane Number)"
                      value={props.numero_metano.mon}
                      unit=""
                      decimals={2}
                    />
                    <PropertyRow
                      label="MN (Methane Number)"
                      value={props.numero_metano.mn}
                      unit=""
                      decimals={2}
                    />
                  </div>
                </div>

                {/* Propiedades Críticas */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
                    <h3 className="text-lg font-bold text-white">Propiedades Críticas</h3>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <ValueRow
                      label="Tc (Temp. Crítica)"
                      value1={props.propiedades_criticas.tc.value_k}
                      unit1="K"
                      value2={props.propiedades_criticas.tc.value_c}
                      unit2="°C"
                      decimals={2}
                    />
                    <ValueRow
                      label="Tc Corregida"
                      value1={props.propiedades_criticas.tc_corr.value_k}
                      unit1="K"
                      value2={props.propiedades_criticas.tc_corr.value_c}
                      unit2="°C"
                      decimals={2}
                    />
                    <ValueRow
                      label="Pc (Presión Crítica)"
                      value1={props.propiedades_criticas.pc.value_kpa}
                      unit1="kPa"
                      value2={props.propiedades_criticas.pc.value_kg_cm2}
                      unit2="kg/cm²"
                      decimals={2}
                    />
                    <ValueRow
                      label="Pc Corregida"
                      value1={props.propiedades_criticas.pc_corr.value_kpa}
                      unit1="kPa"
                      value2={props.propiedades_criticas.pc_corr.value_kg_cm2}
                      unit2="kg/cm²"
                      decimals={2}
                    />
                    <PropertyRow
                      label="Vc (Volumen Crítico)"
                      value={props.propiedades_criticas.vc.value}
                      unit={props.propiedades_criticas.vc.unit}
                      decimals={6}
                    />
                    <PropertyRow
                      label="Zc (Factor Compresibilidad Crítico)"
                      value={props.propiedades_criticas.zc.value}
                      unit={props.propiedades_criticas.zc.unit}
                      decimals={4}
                    />
                    <ValueRow
                      label="T Congelamiento"
                      value1={props.propiedades_criticas.t_congelamiento.value_k}
                      unit1="K"
                      value2={props.propiedades_criticas.t_congelamiento.value_c}
                      unit2="°C"
                      decimals={2}
                    />
                    <ValueRow
                      label="T Ebullición"
                      value1={props.propiedades_criticas.t_ebullicion.value_k}
                      unit1="K"
                      value2={props.propiedades_criticas.t_ebullicion.value_c}
                      unit2="°C"
                      decimals={2}
                    />
                    <PropertyRow
                      label="Tr (Temp. Reducida)"
                      value={props.propiedades_criticas.tr}
                      unit=""
                      decimals={4}
                    />
                    <PropertyRow
                      label="Pr (Presión Reducida)"
                      value={props.propiedades_criticas.pr}
                      unit=""
                      decimals={4}
                    />
                  </div>
                </div>

                {/* Volumen Líquido Equivalente */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
                    <h3 className="text-lg font-bold text-white">Volumen Líquido Equivalente</h3>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <PropertyRow
                      label="C1+"
                      value={props.volumen_liquido_eq.c1_plus}
                      unit={props.volumen_liquido_eq.unit}
                      decimals={6}
                    />
                    <PropertyRow
                      label="C2+"
                      value={props.volumen_liquido_eq.c2_plus}
                      unit={props.volumen_liquido_eq.unit}
                      decimals={6}
                    />
                    <PropertyRow
                      label="C3+"
                      value={props.volumen_liquido_eq.c3_plus}
                      unit={props.volumen_liquido_eq.unit}
                      decimals={6}
                    />
                    <PropertyRow
                      label="C4+"
                      value={props.volumen_liquido_eq.c4_plus}
                      unit={props.volumen_liquido_eq.unit}
                      decimals={6}
                    />
                    <PropertyRow
                      label="C5+"
                      value={props.volumen_liquido_eq.c5_plus}
                      unit={props.volumen_liquido_eq.unit}
                      decimals={6}
                    />
                  </div>
                </div>

                {/* Composición Porcentual */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-4 py-3">
                    <h3 className="text-lg font-bold text-white">Composición Porcentual</h3>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <PropertyRow
                      label="Oxígeno (O₂)"
                      value={props.composicion_porcentual.oxigeno}
                      unit="%"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Nitrógeno (N₂)"
                      value={props.composicion_porcentual.nitrogeno}
                      unit="%"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Carbono (C)"
                      value={props.composicion_porcentual.carbono}
                      unit="%"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Hidrógeno (H₂)"
                      value={props.composicion_porcentual.hidrogeno}
                      unit="%"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Relación C/H"
                      value={props.composicion_porcentual.ratio_c_h}
                      unit=""
                      decimals={4}
                    />
                  </div>
                </div>

                {/* Otros Datos */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3">
                    <h3 className="text-lg font-bold text-white">Otros Datos</h3>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <PropertyRow
                      label="Aire de Combustión"
                      value={props.otros_datos.aire_combustion.value}
                      unit={props.otros_datos.aire_combustion.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="LFL (Lower Flammability Limit)"
                      value={props.otros_datos.lfl.value}
                      unit={props.otros_datos.lfl.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="UFL (Upper Flammability Limit)"
                      value={props.otros_datos.ufl.value}
                      unit={props.otros_datos.ufl.unit}
                      decimals={4}
                    />
                    <PropertyRow
                      label="LFL (Fracción Molar)"
                      value={props.otros_datos.lfl_fracc_molar}
                      unit=""
                      decimals={6}
                    />
                    <PropertyRow
                      label="UFL (Fracción Molar)"
                      value={props.otros_datos.ufl_fracc_molar}
                      unit=""
                      decimals={6}
                    />
                    <PropertyRow
                      label="Cp (Calor Específico a P constante)"
                      value={props.otros_datos.cp_kj_kg_k}
                      unit="kJ/(kg·K)"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Cv (Calor Específico a V constante)"
                      value={props.otros_datos.cv_kj_kg_k}
                      unit="kJ/(kg·K)"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Cp (kcal/(kg·°C))"
                      value={props.otros_datos.cp_kcal_kg_c}
                      unit="kcal/(kg·°C)"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Cv (kcal/(kg·°C))"
                      value={props.otros_datos.cv_kcal_kg_c}
                      unit="kcal/(kg·°C)"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Cp (kcal/(m³·°C))"
                      value={props.otros_datos.cp_kcal_m3_c}
                      unit="kcal/(m³·°C)"
                      decimals={4}
                    />
                    <PropertyRow
                      label="Cv (kcal/(m³·°C))"
                      value={props.otros_datos.cv_kcal_m3_c}
                      unit="kcal/(m³·°C)"
                      decimals={4}
                    />
                    <PropertyRow
                      label="k (Cp/Cv)"
                      value={props.otros_datos.k_cp_cv}
                      unit=""
                      decimals={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel Slide-in del Informe HTML */}
      <div
        className={`fixed right-0 top-0 h-full w-full bg-white shadow-2xl z-[60] transform transition-transform duration-300 overflow-y-auto ${
          showReport ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Informe HTML</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadReportPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={() => setShowReport(false)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Volver a Resultados
            </button>
          </div>
        </div>

        {/* Contenido del Informe */}
        <div
          id="report-html-content"
          className="p-6"
          dangerouslySetInnerHTML={{ __html: analysis.chroma_report_html || '' }}
        />
      </div>
    </>
  );
}
