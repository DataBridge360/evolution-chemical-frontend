/**
 * Página de detalle de análisis cromatográfico
 * Muestra los resultados EXACTAMENTE como en el Excel de referencia
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAnalysis,
  calculateProperties,
  approveAnalysis,
  generateReport,
} from '@/src/modules/chromatography/services/chromatographyService';
import { ChromatographicAnalysis } from '@/src/modules/chromatography/types';

interface Props {
  params: { id: string };
}

// Helper function to safely format numbers
const safeFormat = (value: number | undefined | null, decimals: number = 2): string => {
  // Si el valor es explícitamente 0, mostrarlo como "0.000..."
  if (value === 0) {
    return value.toFixed(decimals);
  }
  // Si es undefined, null o NaN, mostrar guión
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }
  return value.toFixed(decimals);
};

export default function AnalysisDetailPage({ params }: Props) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ChromatographicAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [params.id]);

  const loadAnalysis = async () => {
    try {
      const data = await getAnalysis(params.id);
      console.log('🔍 Análisis cargado:', data);
      console.log('🔍 Propiedades calculadas:', data.calculated_properties);
      if (data.calculated_properties?.composicion) {
        console.log('🔍 Primer compuesto:', data.calculated_properties.composicion[0]);
      }
      setAnalysis(data);
    } catch (err: any) {
      console.error('Error loading analysis:', err);

      // Check if it's an authentication error
      if (err.message?.includes('autenticación') || err.message?.includes('401')) {
        setError('No está autenticado. Por favor inicie sesión.');
      } else if (err.message?.includes('404') || err.message?.includes('no se encontró')) {
        setError(`No se encontró el análisis con ID: ${params.id}`);
      } else {
        setError(err.message || 'Error cargando análisis');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!analysis) return;

    setCalculating(true);
    setError(null);

    try {
      const result = await calculateProperties(analysis.analysis_id, {
        apply_o2_n2_discount: analysis.apply_o2_n2_discount,
        discount_percentage: analysis.discount_percentage,
        include_viscosities: analysis.include_viscosities,
      });

      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Error calculando propiedades');
    } finally {
      setCalculating(false);
    }
  };

  const handleApprove = async () => {
    if (!analysis) return;

    try {
      const result = await approveAnalysis(analysis.analysis_id);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Error aprobando análisis');
    }
  };

  const handleGenerateReport = async () => {
    if (!analysis) return;

    setGenerating(true);
    setError(null);

    try {
      const report = await generateReport(analysis.analysis_id, {
        report_type: 'extended',
      });

      if (report.file) {
        window.open(report.file, '_blank');
      }

      await loadAnalysis();
    } catch (err: any) {
      setError(err.message || 'Error generando informe');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No se encontró el análisis</p>
          <button
            onClick={() => router.push('/cromatografia')}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const props = analysis.calculated_properties;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análisis Cromatográfico</h1>
            <p className="mt-1 text-gray-600">
              {analysis.company_name} {analysis.field_name && `- ${analysis.field_name}`}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/cromatografia')}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Status badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              analysis.status === 'draft'
                ? 'bg-gray-100 text-gray-800'
                : analysis.status === 'calculated'
                  ? 'bg-blue-100 text-blue-800'
                  : analysis.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
            }`}
          >
            {analysis.status === 'draft' && 'Borrador'}
            {analysis.status === 'calculated' && 'Calculado'}
            {analysis.status === 'approved' && 'Aprobado'}
            {analysis.status === 'reported' && 'Informado'}
          </span>
        </div>

        {/* Botón calcular si es borrador */}
        {analysis.status === 'draft' && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Composición Detectada</h2>
            <div className="mb-4 grid grid-cols-3 gap-4">
              {analysis.composition &&
                Object.entries(analysis.composition).map(([code, pct]) => (
                  <div key={code} className="flex justify-between text-sm">
                    <span className="text-gray-600">{code}</span>
                    <span className="font-medium">{safeFormat(pct as number, 3)}%</span>
                  </div>
                ))}
            </div>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {calculating ? 'Calculando...' : 'Calcular Propiedades'}
            </button>
          </div>
        )}

        {/* Resultados Completos */}
        {props && (
          <div className="space-y-6">
            {/* SECCIÓN 1: TABLA COMPLETA DE COMPUESTOS */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="bg-blue-600 px-6 py-3">
                <h2 className="text-lg font-semibold text-white">
                  Tabla Completa de Análisis - Composición del Gas
                </h2>
                <p className="mt-1 text-xs text-blue-100">
                  Desplace horizontalmente para ver todas las columnas
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="sticky left-0 z-10 border-r-2 border-gray-300 bg-gray-50 px-3 py-2 text-left font-medium text-gray-700">
                        Componente
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                        %Molar
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                        Fracc.Molar
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                        % Volumen
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                        % Masa
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                        Z(mezcla)
                      </th>
                      <th className="whitespace-nowrap bg-blue-50 px-3 py-2 text-right font-medium text-gray-600">
                        Fc. %vol
                      </th>
                      <th className="whitespace-nowrap bg-blue-50 px-3 py-2 text-right font-medium text-gray-600">
                        Fc.%masa
                      </th>
                      <th className="whitespace-nowrap bg-blue-50 px-3 py-2 text-right font-medium text-gray-600">
                        Z
                      </th>
                      <th className="whitespace-nowrap bg-green-50 px-3 py-2 text-right font-medium text-gray-600">
                        Peso Molec.
                      </th>
                      <th className="whitespace-nowrap bg-green-50 px-3 py-2 text-right font-medium text-gray-600">
                        Fac.Sum.
                      </th>
                      <th className="whitespace-nowrap bg-yellow-50 px-3 py-2 text-right font-medium text-gray-600">
                        P.Cal.Sup. (kJ/mol)
                      </th>
                      <th className="whitespace-nowrap bg-yellow-50 px-3 py-2 text-right font-medium text-gray-600">
                        P.Cal.Inf. (kJ/mol)
                      </th>
                      <th className="whitespace-nowrap bg-yellow-50 px-3 py-2 text-right font-medium text-gray-600">
                        kJ/mol (sup)
                      </th>
                      <th className="whitespace-nowrap bg-yellow-50 px-3 py-2 text-right font-medium text-gray-600">
                        kJ/mol (inf)
                      </th>
                      <th className="whitespace-nowrap bg-purple-50 px-3 py-2 text-right font-medium text-gray-600">
                        Dens. Relativa
                      </th>
                      <th className="whitespace-nowrap bg-purple-50 px-3 py-2 text-right font-medium text-gray-600">
                        Masa Molar
                      </th>
                      <th className="whitespace-nowrap bg-red-50 px-3 py-2 text-right font-medium text-gray-600">
                        Temp. Critica
                      </th>
                      <th className="whitespace-nowrap bg-red-50 px-3 py-2 text-right font-medium text-gray-600">
                        Presion Critica
                      </th>
                      <th className="whitespace-nowrap bg-red-50 px-3 py-2 text-right font-medium text-gray-600">
                        Temp. Pseudocritica
                      </th>
                      <th className="whitespace-nowrap bg-red-50 px-3 py-2 text-right font-medium text-gray-600">
                        Pres. Pseudocritica
                      </th>
                      <th className="whitespace-nowrap bg-indigo-50 px-3 py-2 text-right font-medium text-gray-600">
                        vci m3/kg
                      </th>
                      <th className="whitespace-nowrap bg-indigo-50 px-3 py-2 text-right font-medium text-gray-600">
                        Vci m3/kmol
                      </th>
                      <th className="whitespace-nowrap bg-indigo-50 px-3 py-2 text-right font-medium text-gray-600">
                        Zci
                      </th>
                      <th className="whitespace-nowrap bg-indigo-50 px-3 py-2 text-right font-medium text-gray-600">
                        Zcm
                      </th>
                      <th className="whitespace-nowrap bg-indigo-50 px-3 py-2 text-right font-medium text-gray-600">
                        Vcm m3/kmol
                      </th>
                      <th className="whitespace-nowrap bg-pink-50 px-3 py-2 text-right font-medium text-gray-600">
                        Temp. Solidificacion (ºC)
                      </th>
                      <th className="whitespace-nowrap bg-pink-50 px-3 py-2 text-right font-medium text-gray-600">
                        Freezing Point mix (ºC)
                      </th>
                      <th className="whitespace-nowrap bg-cyan-50 px-3 py-2 text-right font-medium text-gray-600">
                        m3 gas/m3 liq
                      </th>
                      <th className="whitespace-nowrap bg-cyan-50 px-3 py-2 text-right font-medium text-gray-600">
                        m3 gas/m3 liq ??
                      </th>
                      <th className="whitespace-nowrap bg-pink-50 px-3 py-2 text-right font-medium text-gray-600">
                        Temp. Ebullicion (ºC)
                      </th>
                      <th className="whitespace-nowrap bg-pink-50 px-3 py-2 text-right font-medium text-gray-600">
                        Boiling Point mix (ºC)
                      </th>
                      <th className="whitespace-nowrap bg-orange-50 px-3 py-2 text-right font-medium text-gray-600">
                        CARBONO
                      </th>
                      <th className="whitespace-nowrap bg-orange-50 px-3 py-2 text-right font-medium text-gray-600">
                        HIDROGENO
                      </th>
                      <th className="whitespace-nowrap bg-orange-50 px-3 py-2 text-right font-medium text-gray-600">
                        OXIGENO
                      </th>
                      <th className="whitespace-nowrap bg-orange-50 px-3 py-2 text-right font-medium text-gray-600">
                        NITROGENO
                      </th>
                      <th className="whitespace-nowrap bg-teal-50 px-3 py-2 text-right font-medium text-gray-600">
                        Aire Req. p/Combust. m3(aire)/m3(gas)
                      </th>
                      <th className="whitespace-nowrap bg-teal-50 px-3 py-2 text-right font-medium text-gray-600">
                        Aire Req. p/Combust. Mezcla
                      </th>
                      <th className="whitespace-nowrap bg-amber-50 px-3 py-2 text-right font-medium text-gray-600">
                        Limite Infl. Inf.
                      </th>
                      <th className="whitespace-nowrap bg-amber-50 px-3 py-2 text-right font-medium text-gray-600">
                        Limite Infl. Sup.
                      </th>
                      <th className="whitespace-nowrap bg-amber-50 px-3 py-2 text-right font-medium text-gray-600">
                        Limite Infl. Inf. Mezcla
                      </th>
                      <th className="whitespace-nowrap bg-amber-50 px-3 py-2 text-right font-medium text-gray-600">
                        Limite Infl. Sup. Mezcla
                      </th>
                      <th className="whitespace-nowrap bg-lime-50 px-3 py-2 text-right font-medium text-gray-600">
                        Cp
                      </th>
                      <th className="whitespace-nowrap bg-lime-50 px-3 py-2 text-right font-medium text-gray-600">
                        Cv
                      </th>
                      <th className="whitespace-nowrap bg-lime-50 px-3 py-2 text-right font-medium text-gray-600">
                        Cp(mezcla)
                      </th>
                      <th className="whitespace-nowrap bg-lime-50 px-3 py-2 text-right font-medium text-gray-600">
                        Cv(mezcla)
                      </th>
                      <th className="whitespace-nowrap bg-emerald-50 px-3 py-2 text-right font-medium text-gray-600">
                        Ratio H/C
                      </th>
                      <th className="whitespace-nowrap bg-emerald-50 px-3 py-2 text-right font-medium text-gray-600">
                        Ratio H/C Mezcla
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {props.composicion.map((comp, idx) => {
                      // Log temporal para debugging
                      if (idx === 0) {
                        console.log('🔍 Estructura del primer compuesto:', comp);
                        console.log('🔍 Propiedades disponibles:', Object.keys(comp));
                      }
                      if (idx === props.composicion.length - 1) {
                        console.log('🔍 Último elemento (¿TOTALES?):', comp);
                      }

                      // Detectar si es la fila de totales
                      const isTotalesRow = comp.name?.toUpperCase() === 'TOTALES' || comp.code?.toUpperCase() === 'TOTALES';

                      return (
                      <tr key={idx} className={isTotalesRow ? 'border-t-4 border-blue-600 bg-blue-50 font-bold' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                        <td className="sticky left-0 z-10 whitespace-nowrap border-r-2 border-gray-300 bg-inherit px-3 py-2 font-medium text-gray-900">
                          {comp.name} ({comp.formula})
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pct_molar, 2)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.fracc_molar, 7)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pct_volumen, 3)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pct_masa, 3)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.fc_suma_k, 4)}
                        </td>
                        <td className="bg-blue-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.fc_pct_vol, 4)}
                        </td>
                        <td className="bg-blue-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.fc_pct_masa, 4)}
                        </td>
                        <td className="bg-blue-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.z_puro, 4)}
                        </td>
                        <td className="bg-green-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.masa_molar, 3)}
                        </td>
                        <td className="bg-green-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.k, 4)}
                        </td>
                        <td className="bg-yellow-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pcs, 2)}
                        </td>
                        <td className="bg-yellow-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pci, 3)}
                        </td>
                        <td className="bg-yellow-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pcs_mezcla, 2)}
                        </td>
                        <td className="bg-yellow-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pci_mezcla, 3)}
                        </td>
                        <td className="bg-purple-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.densidad_relativa, 3)}
                        </td>
                        <td className="bg-purple-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.masa_molar_pura, 3)}
                        </td>
                        <td className="bg-red-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.tc, 2)}
                        </td>
                        <td className="bg-red-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pc, 1)}
                        </td>
                        <td className="bg-red-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.tc_contrib, 3)}
                        </td>
                        <td className="bg-red-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.pc_contrib, 3)}
                        </td>
                        <td className="bg-indigo-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.vc_spec, 5)}
                        </td>
                        <td className="bg-indigo-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.vc_molar, 5)}
                        </td>
                        <td className="bg-indigo-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.zc, 4)}
                        </td>
                        <td className="bg-indigo-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.zc_contrib, 4)}
                        </td>
                        <td className="bg-indigo-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.vc_contrib, 5)}
                        </td>
                        <td className="bg-pink-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.t_solid, 2)}
                        </td>
                        <td className="bg-pink-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.t_solid_contrib, 3)}
                        </td>
                        <td className="bg-cyan-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.m3_gas_m3_liq, 3)}
                        </td>
                        <td className="bg-cyan-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.vol_liq_eq, 3)}
                        </td>
                        <td className="bg-pink-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.t_boil, 3)}
                        </td>
                        <td className="bg-pink-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.t_boil_contrib, 3)}
                        </td>
                        <td className="bg-orange-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.n_carbon, 3)}
                        </td>
                        <td className="bg-orange-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.n_hydrogen, 3)}
                        </td>
                        <td className="bg-orange-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.n_oxygen, 3)}
                        </td>
                        <td className="bg-orange-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.n_nitrogen, 3)}
                        </td>
                        <td className="bg-teal-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.aire_req, 3)}
                        </td>
                        <td className="bg-teal-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.aire_req_contrib, 3)}
                        </td>
                        <td className="bg-amber-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.lfl, 1)}
                        </td>
                        <td className="bg-amber-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.ufl, 1)}
                        </td>
                        <td className="bg-amber-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.lfl_contrib, 3)}
                        </td>
                        <td className="bg-amber-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.ufl_contrib, 3)}
                        </td>
                        <td className="bg-lime-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.cp_puro, 5)}
                        </td>
                        <td className="bg-lime-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.cv_puro, 5)}
                        </td>
                        <td className="bg-lime-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.cp_mezcla, 5)}
                        </td>
                        <td className="bg-lime-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.cv_mezcla, 5)}
                        </td>
                        <td className="bg-emerald-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.hc_ratio, 2)}
                        </td>
                        <td className="bg-emerald-50 px-3 py-2 text-right text-gray-700">
                          {safeFormat(comp.hc_ratio_contrib, 2)}
                        </td>
                      </tr>
                    );
                    })}

                    {/* Fila de TOTALES (solo si no viene en el array composicion) */}
                    {props.totales && !props.composicion.some(c => c.name?.toUpperCase() === 'TOTALES' || c.code?.toUpperCase() === 'TOTALES') && (
                      <tr className="border-t-4 border-blue-600 bg-blue-50 font-bold">
                        <td className="sticky left-0 z-10 border-r-2 border-gray-300 bg-blue-50 px-3 py-2 text-gray-900">
                          TOTALES
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900">
                          {safeFormat(props.totales.pct_molar, 2)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900">-</td>
                        <td className="px-3 py-2 text-right text-gray-900">
                          {safeFormat(props.totales.pct_volumen, 3)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900">
                          {safeFormat(props.totales.pct_masa, 3)}
                        </td>
                        {/* Agregar más columnas de totales según sea necesario */}
                        <td colSpan={42} className="px-3 py-2 text-center text-gray-500">
                          Ver resumen en secciones inferiores
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN 2: CARACTERÍSTICAS GENERALES */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Características Generales */}
              <div className="rounded-lg bg-white shadow lg:col-span-2">
                <div className="bg-green-600 px-6 py-3">
                  <h2 className="text-lg font-semibold text-white">Caracteristicas Generales</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <PropertyRow
                      label="Masa Molecular"
                      value={props.caracteristicas_generales.masa_molecular}
                    />
                    <PropertyRow
                      label="Volumen Molar"
                      value={props.caracteristicas_generales.volumen_molar}
                    />
                    <PropertyRow
                      label="Densidad Relativa (aire=1)"
                      value={props.caracteristicas_generales.densidad_relativa}
                    />
                    <PropertyRow
                      label="Densidad Absoluta"
                      value={props.caracteristicas_generales.densidad_absoluta}
                    />
                    <PropertyRow
                      label="Poder Cal. Superior"
                      value={props.caracteristicas_generales.pcs}
                    />
                    <PropertyRow
                      label="Poder Cal. Inferior"
                      value={props.caracteristicas_generales.pci}
                    />
                    {props.caracteristicas_generales.viscosidad_dean_stiel && (
                      <PropertyRow
                        label="Viscosidad gas - Dean-Stiel"
                        value={props.caracteristicas_generales.viscosidad_dean_stiel}
                      />
                    )}
                    {props.caracteristicas_generales.viscosidad_lucas && (
                      <PropertyRow
                        label="Viscosidad gas - Lucas"
                        value={props.caracteristicas_generales.viscosidad_lucas}
                      />
                    )}
                    <PropertyRow
                      label="F. Compresibilidad"
                      value={props.caracteristicas_generales.f_compresibilidad}
                    />
                    <PropertyRow
                      label="Indice de Wobbe"
                      value={props.caracteristicas_generales.indice_wobbe}
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: NÚMERO DE METANO */}
              <div className="rounded-lg bg-white shadow">
                <div className="bg-orange-600 px-6 py-3">
                  <h2 className="text-lg font-semibold text-white">Número de Metano</h2>
                </div>
                <div className="space-y-4 p-6">
                  <div className="rounded-lg bg-orange-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">MON (Motor Octane Number)</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {safeFormat(props.numero_metano.mon, 2)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">MN (Methane Number)</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {safeFormat(props.numero_metano.mn, 2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: PROPIEDADES CRÍTICAS */}
            <div className="rounded-lg bg-white shadow">
              <div className="bg-purple-600 px-6 py-3">
                <h2 className="text-lg font-semibold text-white">Propiedades Criticas</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Temperatura Critica</p>
                      <div className="mt-1 flex items-baseline gap-4">
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.tc.value_k, 3)}</span>
                        <span className="text-sm text-gray-600">°K</span>
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.tc.value_c, 4)}</span>
                        <span className="text-sm text-gray-600">°C</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Temperatura Critica Corr.</p>
                      <div className="mt-1 flex items-baseline gap-4">
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.tc_corr.value_k, 3)}</span>
                        <span className="text-sm text-gray-600">°K</span>
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.tc_corr.value_c, 4)}</span>
                        <span className="text-sm text-gray-600">°C</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Presion Critica</p>
                      <div className="mt-1 flex items-baseline gap-4">
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.pc.value_kpa, 3)}</span>
                        <span className="text-sm text-gray-600">kPa</span>
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.pc.value_kg_cm2, 4)}</span>
                        <span className="text-sm text-gray-600">kg/cm2</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Presion Critica Corr.</p>
                      <div className="mt-1 flex items-baseline gap-4">
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.pc_corr.value_kpa, 3)}</span>
                        <span className="text-sm text-gray-600">kPa</span>
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.pc_corr.value_kg_cm2, 4)}</span>
                        <span className="text-sm text-gray-600">kg/cm2</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <PropertyRow label="Volumen Critico" value={props.propiedades_criticas.vc} />
                    <PropertyRow
                      label="Compresibilidad Critica"
                      value={props.propiedades_criticas.zc}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Punto de Congelamiento</p>
                      <div className="mt-1 flex items-baseline gap-4">
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.t_congelamiento.value_k, 3)}</span>
                        <span className="text-sm text-gray-600">°K</span>
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.t_congelamiento.value_c, 4)}</span>
                        <span className="text-sm text-gray-600">°C</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Punto de Ebullicion</p>
                      <div className="mt-1 flex items-baseline gap-4">
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.t_ebullicion.value_k, 3)}</span>
                        <span className="text-sm text-gray-600">°K</span>
                        <span className="text-base font-semibold">{safeFormat(props.propiedades_criticas.t_ebullicion.value_c, 4)}</span>
                        <span className="text-sm text-gray-600">°C</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Temp. Reducida</p>
                      <p className="text-base font-semibold">{safeFormat(props.propiedades_criticas.tr, 2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Presion Reducida</p>
                      <p className="text-base font-semibold">{safeFormat(props.propiedades_criticas.pr, 2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 5 y 6: VOLUMEN LÍQUIDO + COMPOSICIÓN PORCENTUAL */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Volumen de Líquido Equivalente */}
              <div className="rounded-lg bg-white shadow">
                <div className="bg-cyan-600 px-6 py-3">
                  <h2 className="text-lg font-semibold text-white">
                    Volumen de liquido equivalente
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">C1+</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.volumen_liquido_eq.c1_plus, 4)} <span className="text-gray-500">{props.volumen_liquido_eq.unit}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">C2+</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.volumen_liquido_eq.c2_plus, 4)} <span className="text-gray-500">{props.volumen_liquido_eq.unit}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">C3+</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.volumen_liquido_eq.c3_plus, 4)} <span className="text-gray-500">{props.volumen_liquido_eq.unit}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">C4+</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.volumen_liquido_eq.c4_plus, 4)} <span className="text-gray-500">{props.volumen_liquido_eq.unit}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">C5+</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.volumen_liquido_eq.c5_plus, 4)} <span className="text-gray-500">{props.volumen_liquido_eq.unit}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Composición Porcentual */}
              <div className="rounded-lg bg-white shadow">
                <div className="bg-indigo-600 px-6 py-3">
                  <h2 className="text-lg font-semibold text-white">Composicion Porcentual</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Oxigeno</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.composicion_porcentual.oxigeno, 1)} <span className="text-gray-500">%</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nitrogeno</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.composicion_porcentual.nitrogeno, 1)} <span className="text-gray-500">%</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Carbono</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.composicion_porcentual.carbono, 1)} <span className="text-gray-500">%</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hidrogeno</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.composicion_porcentual.hidrogeno, 1)} <span className="text-gray-500">%</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Relacion Carbono-Hidrogeno</span>
                      <span className="text-sm font-medium">
                        {safeFormat(props.composicion_porcentual.ratio_c_h, 2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 7: OTROS DATOS */}
            <div className="rounded-lg bg-white shadow">
              <div className="bg-red-600 px-6 py-3">
                <h2 className="text-lg font-semibold text-white">Otros Datos</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {/* Aire requerido */}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Aire Req. p/Combust.</p>
                    <div className="mt-1 flex items-baseline gap-4">
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.aire_combustion.value, 3)}</span>
                      <span className="text-sm text-gray-600">{props.otros_datos.aire_combustion.unit}</span>
                    </div>
                  </div>

                  {/* Límites de inflamabilidad */}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Limite de inflamabilidad Inf.</p>
                    <div className="mt-1 flex items-baseline gap-4">
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.lfl.value, 3)}</span>
                      <span className="text-sm text-gray-600">% Vol.</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.lfl_fracc_molar, 4)}</span>
                      <span className="text-sm text-gray-600">Fracc. Molar</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Limite de inflamabilidad Sup.</p>
                    <div className="mt-1 flex items-baseline gap-4">
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.ufl.value, 3)}</span>
                      <span className="text-sm text-gray-600">% Vol.</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.ufl_fracc_molar, 4)}</span>
                      <span className="text-sm text-gray-600">Fracc. Molar</span>
                    </div>
                  </div>

                  {/* Calores específicos */}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cp</p>
                    <div className="mt-1 flex items-baseline gap-4">
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.cp_kj_kg_k, 3)}</span>
                      <span className="text-sm text-gray-600">kJ/(kg ºK)</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.cp_kcal_kg_c, 4)}</span>
                      <span className="text-sm text-gray-600">kcal/(kg ºC)</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.cp_kcal_m3_c, 4)}</span>
                      <span className="text-sm text-gray-600">kcal/(m3 ºC)</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Cv</p>
                    <div className="mt-1 flex items-baseline gap-4">
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.cv_kj_kg_k, 3)}</span>
                      <span className="text-sm text-gray-600">kJ/(kg ºK)</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.cv_kcal_kg_c, 4)}</span>
                      <span className="text-sm text-gray-600">kcal/(kg ºC)</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.cv_kcal_m3_c, 4)}</span>
                      <span className="text-sm text-gray-600">kcal/(m3 ºC)</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Cp/Cv</p>
                    <div className="mt-1 flex items-baseline gap-4">
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.k_cp_cv, 3)}</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.k_cp_cv, 3)}</span>
                      <span className="text-base font-semibold">{safeFormat(props.otros_datos.k_cp_cv, 3)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex space-x-4">
              {analysis.status === 'calculated' && (
                <button
                  onClick={handleApprove}
                  className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700"
                >
                  Aprobar Análisis
                </button>
              )}
              {(analysis.status === 'approved' || analysis.status === 'reported') && (
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="rounded-md bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {generating ? 'Generando...' : 'Generar Informe XLSX'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyRow({
  label,
  value,
}: {
  label: string;
  value: { value: number; unit: string } | undefined;
}) {
  if (!value) {
    return (
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-base font-medium text-gray-400">N/A</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-base font-medium">
        {safeFormat(value.value, 4)} <span className="text-sm text-gray-500">{value.unit}</span>
      </p>
    </div>
  );
}

function ValueRow({
  label,
  value,
  decimals = 2,
  suffix = '',
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium">
        {safeFormat(value, decimals)} {suffix}
      </span>
    </div>
  );
}
