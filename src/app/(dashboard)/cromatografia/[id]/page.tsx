/**
 * Página de detalle de análisis cromatográfico
 * Muestra los resultados EXACTAMENTE como en el Excel de referencia
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Droplets,
  FileText,
  FlaskConical,
  Gauge,
  ShieldAlert,
  Thermometer,
  Save,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAnalysis } from '@/src/modules/chromatography/hooks/useAnalysis';
import { useUpdateAnalysis } from '@/src/modules/chromatography/hooks/useUpdateAnalysis';
import type { CustomDataField } from '@/src/modules/chromatography/types';

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
  const { data: analysis, isLoading: loading, error: queryError } = useAnalysis(params.id);
  const updateMutation = useUpdateAnalysis(params.id);

  const [h2sContent, setH2sContent] = useState('');
  const [isEditingCharacteristics, setIsEditingCharacteristics] = useState(false);
  const [isEditingOtherData, setIsEditingOtherData] = useState(false);
  const [customData, setCustomData] = useState<CustomDataField[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', value: '', unit: '' });
  const otherDataSectionRef = useRef<HTMLDivElement>(null);

  // Cargar valores iniciales cuando cambia el análisis
  useEffect(() => {
    if (analysis) {
      setH2sContent(analysis.h2s_content || 'NE');
      setCustomData(analysis.calculated_properties?.otros_datos?._custom || []);
    }
  }, [analysis]);

  // Función para guardar H2S
  const handleSaveCharacteristics = async () => {
    try {
      await updateMutation.mutateAsync({
        h2s_content: h2sContent,
      });

      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      alert(`Error al guardar: ${error?.message || 'Error desconocido'}`);
    }
  };

  // Función para guardar datos personalizados
  const handleSaveOtherData = async () => {
    try {
      const updatedProperties = analysis?.calculated_properties
        ? JSON.parse(JSON.stringify(analysis.calculated_properties))
        : {};

      if (!updatedProperties.otros_datos) {
        updatedProperties.otros_datos = {};
      }
      updatedProperties.otros_datos._custom = customData;

      await updateMutation.mutateAsync({
        calculated_properties: updatedProperties,
      });

      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      alert(`Error al guardar: ${error?.message || 'Error desconocido'}`);
    }
  };

  // Funciones para manejar datos personalizados
  const handleAddCustomData = () => {
    setEditingIndex(null);
    setFormData({ name: '', value: '', unit: '' });
    setShowAddForm(true);
  };

  const handleEditCustomData = (index: number) => {
    setEditingIndex(index);
    setFormData(customData[index]);
    setShowAddForm(true);
  };

  const handleDeleteCustomData = (index: number) => {
    if (confirm('¿Eliminar este dato?')) {
      setCustomData(customData.filter((_, i) => i !== index));
    }
  };

  const handleSaveForm = () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...customData];
      updated[editingIndex] = formData;
      setCustomData(updated);
    } else {
      setCustomData([...customData, formData]);
    }

    setShowAddForm(false);
    setFormData({ name: '', value: '', unit: '' });
    setEditingIndex(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setFormData({ name: '', value: '', unit: '' });
    setEditingIndex(null);
  };

  const handleEnterEditMode = () => {
    setIsEditingOtherData(true);
    setTimeout(() => {
      otherDataSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Convertir error de React Query a string
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message?.includes('401')
        ? 'No está autenticado. Por favor inicie sesión.'
        : queryError.message?.includes('404')
          ? `No se encontró el análisis con ID: ${params.id}`
          : queryError.message || 'Error cargando análisis'
      : 'Error cargando análisis'
    : null;

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
        {/* Header con botones */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => router.push('/cromatografia')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>

            {analysis.chroma_report_html && (
              <button
                onClick={() => router.push(`/cromatografia/${analysis.analysis_id}/informe`)}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
              >
                <FileText className="h-4 w-4" />
                Ver Informe
              </button>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análisis Cromatográfico</h1>
            <p className="mt-1 text-gray-600">
              {analysis.company_name} {analysis.field_name && `- ${analysis.field_name}`}
            </p>
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
                      // Detectar si es la fila de totales
                      const isTotalesRow =
                        comp.name?.toUpperCase() === 'TOTALES' ||
                        comp.code?.toUpperCase() === 'TOTALES';

                      return (
                        <tr
                          key={idx}
                          className={
                            isTotalesRow
                              ? 'border-t-4 border-blue-600 bg-blue-50 font-bold'
                              : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-gray-50'
                          }
                        >
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
                    {props.totales &&
                      !props.composicion.some(
                        (c) =>
                          c.name?.toUpperCase() === 'TOTALES' ||
                          c.code?.toUpperCase() === 'TOTALES',
                      ) && (
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

            <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
              <SectionCard
                title="Características generales"
                description="Resumen físico y energético de la mezcla."
                icon={<FlaskConical className="h-4 w-4" />}
                headerActions={
                  !isEditingCharacteristics ? (
                    <button
                      onClick={() => setIsEditingCharacteristics(true)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4" />
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsEditingCharacteristics(false);
                          setH2sContent(analysis?.h2s_content || 'NE');
                        }}
                        className="flex items-center gap-2 rounded-lg bg-gray-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveCharacteristics}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-green-400"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Guardar
                          </>
                        )}
                      </button>
                    </>
                  )
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricTile
                    label="Masa molecular"
                    value={props.caracteristicas_generales.masa_molecular}
                  />
                  <MetricTile
                    label="Volumen molar"
                    value={props.caracteristicas_generales.volumen_molar}
                  />
                  <MetricTile
                    label="Densidad relativa"
                    value={props.caracteristicas_generales.densidad_relativa}
                  />
                  <MetricTile
                    label="Densidad absoluta"
                    value={props.caracteristicas_generales.densidad_absoluta}
                  />
                  <MetricTile
                    label="Poder cal. superior"
                    value={props.caracteristicas_generales.pcs}
                  />
                  <MetricTile
                    label="Poder cal. inferior"
                    value={props.caracteristicas_generales.pci}
                  />
                  {props.caracteristicas_generales.viscosidad_dean_stiel && (
                    <MetricTile
                      label="Viscosidad Dean-Stiel"
                      value={props.caracteristicas_generales.viscosidad_dean_stiel}
                    />
                  )}
                  {props.caracteristicas_generales.viscosidad_lucas && (
                    <MetricTile
                      label="Viscosidad Lucas"
                      value={props.caracteristicas_generales.viscosidad_lucas}
                    />
                  )}
                  <MetricTile
                    label="Factor de compresibilidad"
                    value={props.caracteristicas_generales.f_compresibilidad}
                  />
                  <MetricTile
                    label="Índice de Wobbe"
                    value={props.caracteristicas_generales.indice_wobbe}
                  />
                  {/* Campo editable H2S */}
                  <div className="rounded-2xl border border-[#e5edf6] bg-[#fbfdff] p-4">
                    <p className="text-sm text-[#60758b]">Contenido de H2S</p>
                    {isEditingCharacteristics ? (
                      <input
                        type="text"
                        value={h2sContent}
                        onChange={(e) => setH2sContent(e.target.value)}
                        className="mt-2 w-full rounded-lg border-2 border-blue-500 bg-white px-3 py-2 text-lg font-semibold text-[#10243e] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="NE"
                      />
                    ) : (
                      <p className="mt-2 text-lg font-semibold text-[#10243e]">{h2sContent}</p>
                    )}
                    <p className="mt-1 text-sm text-[#60758b]">ppm,v (*)</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Número de metano"
                description="Indicadores de comportamiento del combustible."
                icon={<Gauge className="h-4 w-4" />}
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <HighlightTile
                    label="MON"
                    caption="Motor Octane Number"
                    value={props.numero_metano.mon}
                  />
                  <HighlightTile
                    label="MN"
                    caption="Methane Number"
                    value={props.numero_metano.mn}
                  />
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="Propiedades críticas"
              description="Valores críticos, corregidos y reducidos de la mezcla."
              icon={<Thermometer className="h-4 w-4" />}
            >
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                <PairTile
                  label="Temperatura crítica"
                  primaryValue={props.propiedades_criticas.tc.value_k}
                  primaryUnit="°K"
                  secondaryValue={props.propiedades_criticas.tc.value_c}
                  secondaryUnit="°C"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <PairTile
                  label="Temperatura crítica corregida"
                  primaryValue={props.propiedades_criticas.tc_corr.value_k}
                  primaryUnit="°K"
                  secondaryValue={props.propiedades_criticas.tc_corr.value_c}
                  secondaryUnit="°C"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <PairTile
                  label="Presión crítica"
                  primaryValue={props.propiedades_criticas.pc.value_kpa}
                  primaryUnit="kPa"
                  secondaryValue={props.propiedades_criticas.pc.value_kg_cm2}
                  secondaryUnit="kg/cm2"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <PairTile
                  label="Presión crítica corregida"
                  primaryValue={props.propiedades_criticas.pc_corr.value_kpa}
                  primaryUnit="kPa"
                  secondaryValue={props.propiedades_criticas.pc_corr.value_kg_cm2}
                  secondaryUnit="kg/cm2"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <MetricTile label="Volumen crítico" value={props.propiedades_criticas.vc} />
                <MetricTile label="Compresibilidad crítica" value={props.propiedades_criticas.zc} />
                <PairTile
                  label="Punto de congelamiento"
                  primaryValue={props.propiedades_criticas.t_congelamiento.value_k}
                  primaryUnit="°K"
                  secondaryValue={props.propiedades_criticas.t_congelamiento.value_c}
                  secondaryUnit="°C"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <PairTile
                  label="Punto de ebullición"
                  primaryValue={props.propiedades_criticas.t_ebullicion.value_k}
                  primaryUnit="°K"
                  secondaryValue={props.propiedades_criticas.t_ebullicion.value_c}
                  secondaryUnit="°C"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberTile
                    label="Temperatura reducida"
                    value={props.propiedades_criticas.tr}
                    decimals={2}
                  />
                  <NumberTile
                    label="Presión reducida"
                    value={props.propiedades_criticas.pr}
                    decimals={2}
                  />
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Volumen de líquido equivalente"
                description="Cortes acumulados convertidos a líquido."
                icon={<Droplets className="h-4 w-4" />}
              >
                <div className="space-y-2">
                  <DataRow
                    label="C1+"
                    value={props.volumen_liquido_eq.c1_plus}
                    decimals={4}
                    suffix={props.volumen_liquido_eq.unit}
                  />
                  <DataRow
                    label="C2+"
                    value={props.volumen_liquido_eq.c2_plus}
                    decimals={4}
                    suffix={props.volumen_liquido_eq.unit}
                  />
                  <DataRow
                    label="C3+"
                    value={props.volumen_liquido_eq.c3_plus}
                    decimals={4}
                    suffix={props.volumen_liquido_eq.unit}
                  />
                  <DataRow
                    label="C4+"
                    value={props.volumen_liquido_eq.c4_plus}
                    decimals={4}
                    suffix={props.volumen_liquido_eq.unit}
                  />
                  <DataRow
                    label="C5+"
                    value={props.volumen_liquido_eq.c5_plus}
                    decimals={4}
                    suffix={props.volumen_liquido_eq.unit}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Composición porcentual"
                description="Participación elemental consolidada."
                icon={<FlaskConical className="h-4 w-4" />}
              >
                <div className="space-y-2">
                  <DataRow
                    label="Oxígeno"
                    value={props.composicion_porcentual.oxigeno}
                    decimals={1}
                    suffix="%"
                  />
                  <DataRow
                    label="Nitrógeno"
                    value={props.composicion_porcentual.nitrogeno}
                    decimals={1}
                    suffix="%"
                  />
                  <DataRow
                    label="Carbono"
                    value={props.composicion_porcentual.carbono}
                    decimals={1}
                    suffix="%"
                  />
                  <DataRow
                    label="Hidrógeno"
                    value={props.composicion_porcentual.hidrogeno}
                    decimals={1}
                    suffix="%"
                  />
                  <DataRow
                    label="Relación carbono-hidrógeno"
                    value={props.composicion_porcentual.ratio_c_h}
                    decimals={2}
                  />
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="Otros datos"
              description="Combustión, inflamabilidad y capacidad calorífica."
              icon={<ShieldAlert className="h-4 w-4" />}
              headerActions={
                !isEditingOtherData ? (
                  <button
                    onClick={handleEnterEditMode}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Editar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingOtherData(false);
                        setCustomData(analysis.calculated_properties?.otros_datos._custom || []);
                        setShowAddForm(false);
                        setFormData({ name: '', value: '', unit: '' });
                        setEditingIndex(null);
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveOtherData}
                      disabled={updateMutation.isPending}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                  </>
                )
              }
            >
              <div className="space-y-3">
                <MetricTile
                  label="Aire requerido p/combustión"
                  value={props.otros_datos.aire_combustion}
                />
                <PairTile
                  label="Límite de inflamabilidad inferior"
                  primaryValue={props.otros_datos.lfl.value}
                  primaryUnit="% Vol."
                  secondaryValue={props.otros_datos.lfl_fracc_molar}
                  secondaryUnit="Fracc. molar"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <PairTile
                  label="Límite de inflamabilidad superior"
                  primaryValue={props.otros_datos.ufl.value}
                  primaryUnit="% Vol."
                  secondaryValue={props.otros_datos.ufl_fracc_molar}
                  secondaryUnit="Fracc. molar"
                  primaryDecimals={3}
                  secondaryDecimals={4}
                />
                <TripleTile
                  label="Cp"
                  items={[
                    { value: props.otros_datos.cp_kj_kg_k, unit: 'kJ/(kg °K)', decimals: 3 },
                    { value: props.otros_datos.cp_kcal_kg_c, unit: 'kcal/(kg °C)', decimals: 4 },
                    { value: props.otros_datos.cp_kcal_m3_c, unit: 'kcal/(m3 °C)', decimals: 4 },
                  ]}
                />
                <TripleTile
                  label="Cv"
                  items={[
                    { value: props.otros_datos.cv_kj_kg_k, unit: 'kJ/(kg °K)', decimals: 3 },
                    { value: props.otros_datos.cv_kcal_kg_c, unit: 'kcal/(kg °C)', decimals: 4 },
                    { value: props.otros_datos.cv_kcal_m3_c, unit: 'kcal/(m3 °C)', decimals: 4 },
                  ]}
                />
                <NumberTile label="Relación Cp/Cv" value={props.otros_datos.k_cp_cv} decimals={3} />

                {/* Datos personalizados como tiles más */}
                {customData.map((data, index) => (
                  <div
                    key={index}
                    className="relative rounded-2xl border border-[#e5edf6] bg-[#fbfdff] p-4"
                  >
                    <p className="text-sm text-[#60758b]">{data.name}</p>
                    <p className="mt-2 text-lg font-semibold text-[#10243e]">
                      {data.value}{' '}
                      <span className="text-sm font-medium text-[#7c90a5]">{data.unit}</span>
                    </p>
                    {isEditingOtherData && (
                      <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button
                          onClick={() => handleEditCustomData(index)}
                          className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-100"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomData(index)}
                          className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Sección de edición - solo en modo edición */}
                {isEditingOtherData && (
                  <div ref={otherDataSectionRef} className="space-y-3">
                    {!showAddForm && (
                      <div className="flex justify-center">
                        <button
                          onClick={handleAddCustomData}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar dato
                        </button>
                      </div>
                    )}

                    {/* Formulario inline para agregar/editar */}
                    {showAddForm && (
                      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-900">
                          {editingIndex !== null ? 'Editar dato' : 'Nuevo dato'}
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                              Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Ej: Temperatura ambiente"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Valor
                              </label>
                              <input
                                type="text"
                                value={formData.value}
                                onChange={(e) =>
                                  setFormData({ ...formData, value: e.target.value })
                                }
                                placeholder="Ej: 25"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Unidad
                              </label>
                              <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="Ej: °C"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={handleCancelForm}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveForm}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                              {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
  headerActions,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  headerActions?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#d8e3f0] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#e6eef7] bg-[#f8fbff] px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ff] text-[#0b63a8]">
              {icon}
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#10243e]">{title}</h2>
              <p className="text-sm text-[#60758b]">{description}</p>
            </div>
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: { value: number; unit: string } | undefined;
}) {
  if (!value) {
    return (
      <div className="rounded-2xl border border-[#e5edf6] bg-[#fbfdff] p-4">
        <p className="text-sm text-[#60758b]">{label}</p>
        <p className="mt-2 text-base font-medium text-[#95a5b5]">N/A</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e5edf6] bg-[#fbfdff] p-4">
      <p className="text-sm text-[#60758b]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#10243e]">
        {safeFormat(value.value, 4)}{' '}
        <span className="text-sm font-medium text-[#7c90a5]">{value.unit}</span>
      </p>
    </div>
  );
}

function HighlightTile({
  label,
  caption,
  value,
}: {
  label: string;
  caption: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#d7e7f8] bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0b63a8]">{label}</p>
      <p className="mt-2 text-sm text-[#60758b]">{caption}</p>
      <p className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-[#10243e]">
        {safeFormat(value, 2)}
      </p>
    </div>
  );
}

function PairTile({
  label,
  primaryValue,
  primaryUnit,
  secondaryValue,
  secondaryUnit,
  primaryDecimals = 2,
  secondaryDecimals = 2,
}: {
  label: string;
  primaryValue: number | undefined | null;
  primaryUnit: string;
  secondaryValue: number | undefined | null;
  secondaryUnit: string;
  primaryDecimals?: number;
  secondaryDecimals?: number;
}) {
  return (
    <div className="rounded-2xl border border-[#e5edf6] bg-[#fbfdff] p-4">
      <p className="text-sm text-[#60758b]">{label}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#edf3f8] bg-white px-3 py-2">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8aa0b6]">{primaryUnit}</p>
          <p className="mt-1 text-lg font-semibold text-[#10243e]">
            {safeFormat(primaryValue, primaryDecimals)}
          </p>
        </div>
        <div className="rounded-xl border border-[#edf3f8] bg-white px-3 py-2">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8aa0b6]">{secondaryUnit}</p>
          <p className="mt-1 text-lg font-semibold text-[#10243e]">
            {safeFormat(secondaryValue, secondaryDecimals)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TripleTile({
  label,
  items,
}: {
  label: string;
  items: Array<{ value: number; unit: string; decimals?: number }>;
}) {
  return (
    <div className="rounded-2xl border border-[#e5edf6] bg-[#fbfdff] p-4">
      <p className="text-sm text-[#60758b]">{label}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.unit} className="rounded-xl border border-[#edf3f8] bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-[0.08em] text-[#8aa0b6]">{item.unit}</p>
            <p className="mt-1 text-base font-semibold text-[#10243e]">
              {safeFormat(item.value, item.decimals ?? 2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberTile({
  label,
  value,
  decimals = 2,
  suffix = '',
}: {
  label: string;
  value: number | undefined | null;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5edf6] bg-[#fbfdff] p-4">
      <p className="text-sm text-[#60758b]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#10243e]">
        {safeFormat(value, decimals)}
        {suffix ? <span className="ml-2 text-sm font-medium text-[#7c90a5]">{suffix}</span> : null}
      </p>
    </div>
  );
}

function DataRow({
  label,
  value,
  decimals = 2,
  suffix = '',
}: {
  label: string;
  value: number | undefined | null;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#eaf0f6] bg-[#fbfdff] px-4 py-3">
      <span className="text-sm text-[#60758b]">{label}</span>
      <span className="text-sm font-semibold text-[#10243e]">
        {safeFormat(value, decimals)}
        {suffix ? <span className="ml-2 font-medium text-[#7c90a5]">{suffix}</span> : null}
      </span>
    </div>
  );
}
