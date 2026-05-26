/**
 * Página de informe HTML de cromatografía
 * Optimizado para carga rápida con caché
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/src/modules/chromatography/hooks/useAnalysis';
import { ChromatographicAnalysis } from '@/src/modules/chromatography/types';
import Image from 'next/image';

interface Props {
  params: { id: string };
}

export default function InformePage({ params }: Props) {
  const router = useRouter();
  const { data: analysis, isLoading: loading, error: queryError } = useAnalysis(params.id);

  // Campos editables
  const [reportNumber, setReportNumber] = useState('');
  const [pdt, setPdt] = useState('');
  const [operator, setOperator] = useState('');
  const [origin, setOrigin] = useState('');
  const [field, setField] = useState('');
  const [company, setCompany] = useState('');
  const [dataDate, setDataDate] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [pressure, setPressure] = useState('');
  const [temperature, setTemperature] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [zone, setZone] = useState('');
  const [formation, setFormation] = useState('');
  const [sampledBy, setSampledBy] = useState('');
  const [sampleDate, setSampleDate] = useState('');
  const [lastCalibration, setLastCalibration] = useState('');

  // Cargar datos en los campos editables cuando el análisis cambia
  useMemo(() => {
    if (analysis) {
      setReportNumber(analysis.report_number || '');
      setPdt('');
      setOperator(analysis.chromatograph_operator || '');
      setOrigin(analysis.sample_point || '');
      setField(analysis.field_name || '');
      setCompany(analysis.company_name || '');
      setDataDate('');
      setReportDate(analysis.analysis_date || '');
      setPressure(analysis.operating_pressure_kpa?.toString() || 'NR');
      setTemperature(analysis.operating_temperature_c?.toString() || 'NR');
      setFlowRate(analysis.flow_rate?.toString() || 'NR');
      setZone('');
      setFormation('');
      setSampledBy('');
      setSampleDate(analysis.sample_date || '');
      setLastCalibration('');
    }
  }, [analysis]);

  // Convertir error de React Query a string
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message || 'Error cargando análisis'
      : 'Error cargando análisis'
    : !analysis?.calculated_properties && analysis
      ? 'El informe no ha sido calculado aún.'
      : null;

  // Memoizar los componentes para evitar recalcular
  const components = useMemo(() => {
    if (!analysis?.calculated_properties) return [];
    return analysis.calculated_properties.composicion.filter(
      (c) => c.name?.toUpperCase() !== 'TOTALES',
    );
  }, [analysis]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando informe...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis || !analysis.calculated_properties) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'No se encontró el informe'}</p>
          <button
            onClick={() => router.push(`/cromatografia/${params.id}`)}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Volver al Análisis
          </button>
        </div>
      </div>
    );
  }

  const props = analysis.calculated_properties;

  // Función para imprimir/guardar como PDF
  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    // Abrir nueva ventana
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes para descargar el PDF');
      return;
    }

    // Obtener todos los estilos de la página actual
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    // Escribir el HTML completo en la nueva ventana
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe_${analysis.report_number || params.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            ${styles}

            @page {
              size: A4 portrait;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 7px !important;
            }

            #report-content {
              width: 100% !important;
              max-width: 210mm !important;
              margin: 0 auto !important;
              padding: 15px 12px !important;
              font-size: 7px !important;
              line-height: 1.1 !important;
            }

            #report-content * {
              font-size: 7px !important;
            }

            #report-content table {
              font-size: 6px !important;
            }

            #report-content h1 {
              font-size: 12px !important;
              margin: 1px 0 !important;
            }

            #report-content .text-\\[11px\\],
            #report-content .text-\\[10px\\],
            #report-content .text-\\[9px\\] {
              font-size: 7px !important;
            }

            #report-content img {
              max-width: 60% !important;
              height: auto !important;
            }

            #report-content .mt-4,
            #report-content .mt-3,
            #report-content .mt-2 {
              margin-top: 0.5rem !important;
            }

            #report-content .p-\\[25px_18px\\] {
              padding: 15px 12px !important;
            }

            .vertical-note {
              writing-mode: vertical-rl !important;
              transform: rotate(180deg) !important;
              position: absolute !important;
              left: 2px !important;
              top: 200px !important;
              font-size: 5px !important;
              max-height: 400px !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 100);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#e9e9e9] p-6">
      <style jsx global>{`
        @media screen {
          input:focus {
            background: #ffffcc !important;
            outline: 1px solid #1a5fb4 !important;
          }
        }

        @media screen {
          input:focus {
            background: #ffffcc !important;
            outline: 1px solid #1a5fb4 !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="print-hidden mx-auto mb-4 flex max-w-[850px] justify-end gap-2">
        <button
          onClick={() => router.push(`/cromatografia/${params.id}`)}
          className="rounded bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          ← Volver
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Descargar Informe
        </button>
      </div>

      {/* Página del informe */}
      <div id="report-content" className="print-page relative mx-auto min-h-[1123px] w-[794px] bg-white p-[25px_18px] text-[10px] leading-tight shadow-lg">
        {/* Header */}
        <div className="border-b border-black pb-1.5">
          <div>
            <Image
              src="/croma/image.png"
              alt="Evolution Chemical"
              width={140}
              height={52}
              className="mb-1"
            />
            <p className="text-[9px] font-bold italic">
              Laboratorio Certificado en Normas de Calidad ISO 9001 / 2015 por Bureau Veritas.
            </p>
          </div>
        </div>

        {/* Título */}
        <div className="my-1 border-b-2 border-black py-1 text-center">
          <h1 className="text-[18px] font-normal" style={{ fontFamily: 'Times New Roman, serif' }}>
            Reporte - Cromatografia Extendida
          </h1>
        </div>

        {/* Datos de cabecera */}
        <div className="grid grid-cols-2 gap-x-8 px-8 py-2.5 text-[11px]">
          {/* Columna izquierda */}
          <div className="space-y-0.5">
            <DataRow
              label="Informe N°"
              value={reportNumber}
              onChange={setReportNumber}
              color="red"
            />
            <DataRow label="PdT" value={pdt} onChange={setPdt} />
            <DataRow label="Operador" value={operator} onChange={setOperator} />
            <DataRow label="Procedencia" value={origin} onChange={setOrigin} color="red" />
            <DataRow label="Yacimiento" value={field} onChange={setField} color="blue" />
            <DataRow label="Empresa" value={company} onChange={setCompany} color="blue" />
            <DataRow label="Datos adq." value={dataDate} onChange={setDataDate} />
            <DataRow label="Fecha Inf." value={reportDate} onChange={setReportDate} />
            <div className="text-right text-[11px] font-normal">Otros datos:</div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-0.5">
            <DataRowWithUnit label="Pres." value={pressure} onChange={setPressure} unit="Kg/cm2" />
            <DataRowWithUnit
              label="Temp."
              value={temperature}
              onChange={setTemperature}
              unit="ºC"
            />
            <DataRow label="Caudal" value={flowRate} onChange={setFlowRate} />
            <DataRow label="Zona" value={zone} onChange={setZone} />
            <DataRow label="Formacion" value={formation} onChange={setFormation} />
            <DataRow label="Muestra Extraida por" value={sampledBy} onChange={setSampledBy} />
            <DataRow label="Fecha muestreo" value={sampleDate} onChange={setSampleDate} />
            <DataRow
              label="Ultima calibracion"
              value={lastCalibration}
              onChange={setLastCalibration}
            />
          </div>
        </div>

        {/* Nota vertical lateral */}
        <div
          className="vertical-note absolute left-2 top-[340px] max-h-[600px] text-[8.5px] leading-[1.4] text-gray-600"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Datos, constantes y formulas tomadas de las normas IRAM-IAPG A 6854 - GPSA Electronic Data
          Book SI Version - Eleventh Edition GPA Standard 2145-03 - GPA Standard 2286-95. Cálculos
          efectuados a 1 atm. Y 15ºC - Basado en ASTM D-1945
        </div>

        {/* Tabla de componentes */}
        <div className="mx-[60px] mt-2">
          <table className="w-full border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-[#cfe8c8]">
                <th
                  className="border border-black p-1 text-center font-bold"
                  style={{ width: '42%' }}
                >
                  Componente
                </th>
                <th
                  className="border border-black p-1 text-center font-bold"
                  style={{ width: '19%' }}
                >
                  % Molar
                </th>
                <th
                  className="border border-black p-1 text-center font-bold"
                  style={{ width: '19%' }}
                >
                  % Volumen
                </th>
                <th
                  className="border border-black p-1 text-center font-bold"
                  style={{ width: '20%' }}
                >
                  % Masa
                </th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp, idx) => (
                <tr key={idx}>
                  <td className="border-l border-r border-black px-2 py-0.5 text-left">
                    {comp.name} ({comp.formula})
                  </td>
                  <td className="border-l border-r border-black px-2 py-0.5 text-right">
                    {comp.pct_molar.toFixed(3)}
                  </td>
                  <td className="border-l border-r border-black px-2 py-0.5 text-right">
                    {comp.pct_volumen.toFixed(3)}
                  </td>
                  <td className="border-l border-r border-black px-2 py-0.5 text-right">
                    {comp.pct_masa.toFixed(3)}
                  </td>
                </tr>
              ))}
              {props.totales && (
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-black px-2 py-0.5 text-center">TOTALES</td>
                  <td className="border border-black px-2 py-0.5 text-right">
                    {props.totales.pct_molar.toFixed(3)}
                  </td>
                  <td className="border border-black px-2 py-0.5 text-right">
                    {props.totales.pct_volumen.toFixed(3)}
                  </td>
                  <td className="border border-black px-2 py-0.5 text-right">
                    {props.totales.pct_masa.toFixed(3)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BLOQUE 1: Características Generales + Propiedades Críticas */}
        <div className="mx-[60px] mt-1.5 grid grid-cols-2 gap-0">
          {/* Características Generales - COMPLETAS (9 propiedades) */}
          <div className="border border-t border-black">
            <div className="border-b border-black bg-gray-100 p-0.5 text-center font-bold">
              Caracteristicas Generales
            </div>
            <table className="w-full text-[9px]">
              <tbody>
                <PropRow
                  label="Masa Molecular"
                  value={props.caracteristicas_generales.masa_molecular}
                />
                <PropRow
                  label="Volumen Molar"
                  value={props.caracteristicas_generales.volumen_molar}
                />
                <PropRow
                  label="Densidad Relativa"
                  value={props.caracteristicas_generales.densidad_relativa}
                />
                <PropRow
                  label="Densidad Absoluta"
                  value={props.caracteristicas_generales.densidad_absoluta}
                />
                <PropRow label="Poder Cal. Superior" value={props.caracteristicas_generales.pcs} />
                <PropRow label="Poder Cal. Inferior" value={props.caracteristicas_generales.pci} />
                <PropRow
                  label="Factor Compresibilidad"
                  value={props.caracteristicas_generales.f_compresibilidad}
                />
                <PropRow
                  label="Indice de Wobbe"
                  value={props.caracteristicas_generales.indice_wobbe}
                />
                {props.caracteristicas_generales.viscosidad_dean_stiel && (
                  <PropRow
                    label="Viscosidad (Dean-Stiel)"
                    value={props.caracteristicas_generales.viscosidad_dean_stiel}
                  />
                )}
                {props.caracteristicas_generales.viscosidad_lucas && (
                  <PropRow
                    label="Viscosidad (Lucas)"
                    value={props.caracteristicas_generales.viscosidad_lucas}
                  />
                )}
              </tbody>
            </table>
          </div>

          {/* Propiedades Críticas - COMPLETAS (9 propiedades) */}
          <div className="border border-l-0 border-t border-black">
            <div className="border-b border-black bg-gray-100 p-0.5 text-center font-bold">
              Propiedades Criticas
            </div>
            <table className="w-full text-[9px]">
              <tbody>
                <tr>
                  <td className="w-1/2 px-1.5 py-0.5">Temp. Critica</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.tc.value_k.toFixed(3)}
                  </td>
                  <td className="w-[75px] px-1">°K</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Temp. Critica Corr.</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.tc_corr.value_k.toFixed(3)}
                  </td>
                  <td className="px-1">°K</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Presion Critica</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.pc.value_kpa.toFixed(3)}
                  </td>
                  <td className="px-1">kPa</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Presion Critica Corr.</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.pc_corr.value_kpa.toFixed(3)}
                  </td>
                  <td className="px-1">kPa</td>
                </tr>
                <PropRow label="Volumen Critico" value={props.propiedades_criticas.vc} />
                <PropRow label="Factor Compres. Critico" value={props.propiedades_criticas.zc} />
                <tr>
                  <td className="px-1.5 py-0.5">Temp. Congelamiento</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.t_congelamiento.value_c.toFixed(3)}
                  </td>
                  <td className="px-1">°C</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Temp. Ebullicion</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.t_ebullicion.value_c.toFixed(3)}
                  </td>
                  <td className="px-1">°C</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Temp. Reducida (Tr)</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.tr.toFixed(3)}
                  </td>
                  <td className="px-1">-</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Presion Reducida (Pr)</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.propiedades_criticas.pr.toFixed(3)}
                  </td>
                  <td className="px-1">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BLOQUE 2: Volumen Líquido Equivalente + Composición Porcentual */}
        <div className="mx-[60px] mt-0 grid grid-cols-2 gap-0">
          {/* Volumen de Líquido Equivalente - COMPLETO (5 propiedades) */}
          <div className="border border-t-0 border-black">
            <div className="border-b border-black bg-gray-100 p-0.5 text-center font-bold">
              Volumen de liquido equivalente
            </div>
            <table className="w-full text-[9px]">
              <tbody>
                <tr>
                  <td className="w-1/2 px-1.5 py-0.5">C1+</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.volumen_liquido_eq.c1_plus.toFixed(3)}
                  </td>
                  <td className="w-[75px] px-1">{props.volumen_liquido_eq.unit}</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">C2+</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.volumen_liquido_eq.c2_plus.toFixed(3)}
                  </td>
                  <td className="px-1">{props.volumen_liquido_eq.unit}</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">C3+</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.volumen_liquido_eq.c3_plus.toFixed(3)}
                  </td>
                  <td className="px-1">{props.volumen_liquido_eq.unit}</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">C4+</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.volumen_liquido_eq.c4_plus.toFixed(3)}
                  </td>
                  <td className="px-1">{props.volumen_liquido_eq.unit}</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">C5+</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.volumen_liquido_eq.c5_plus.toFixed(3)}
                  </td>
                  <td className="px-1">{props.volumen_liquido_eq.unit}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Porcentual de Composición - COMPLETO (5 propiedades) */}
          <div className="border border-l-0 border-t-0 border-black">
            <div className="border-b border-black bg-gray-100 p-0.5 text-center font-bold">
              Porcentual de composicion
            </div>
            <table className="w-full text-[9px]">
              <tbody>
                <tr>
                  <td className="w-1/2 px-1.5 py-0.5">Oxigeno (O)</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.composicion_porcentual.oxigeno.toFixed(3)}
                  </td>
                  <td className="w-[75px] px-1">%</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Nitrogeno (N)</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.composicion_porcentual.nitrogeno.toFixed(3)}
                  </td>
                  <td className="px-1">%</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Carbono (C)</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.composicion_porcentual.carbono.toFixed(3)}
                  </td>
                  <td className="px-1">%</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Hidrogeno (H)</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.composicion_porcentual.hidrogeno.toFixed(3)}
                  </td>
                  <td className="px-1">%</td>
                </tr>
                <tr>
                  <td className="px-1.5 py-0.5">Ratio C/H</td>
                  <td className="px-1.5 py-0.5 text-right">
                    {props.composicion_porcentual.ratio_c_h.toFixed(3)}
                  </td>
                  <td className="px-1">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BLOQUE 3: Otros Datos - COMPLETO */}
        <div className="mx-[60px] mt-0 border border-t-0 border-black">
          <div className="border-b border-black bg-gray-100 p-0.5 text-center font-bold">
            Otros Datos
          </div>
          <table className="w-full text-[11px]">
            <tbody>
              <tr>
                <td className="w-1/4 px-1.5 py-0.5">Aire de combustion</td>
                <td className="w-1/4 px-1.5 py-0.5 text-right">
                  {props.otros_datos.aire_combustion.value.toFixed(3)}
                </td>
                <td className="w-[100px] px-1">{props.otros_datos.aire_combustion.unit}</td>
                <td className="w-1/4 px-1.5 py-0.5">Cp</td>
                <td className="w-1/4 px-1.5 py-0.5 text-right">
                  {props.otros_datos.cp_kj_kg_k.toFixed(3)}
                </td>
                <td className="w-[100px] px-1">kJ/kg·K</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5">LFL</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.lfl.value.toFixed(3)}
                </td>
                <td className="px-1">{props.otros_datos.lfl.unit}</td>
                <td className="px-1.5 py-0.5">Cv</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.cv_kj_kg_k.toFixed(3)}
                </td>
                <td className="px-1">kJ/kg·K</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5">UFL</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.ufl.value.toFixed(3)}
                </td>
                <td className="px-1">{props.otros_datos.ufl.unit}</td>
                <td className="px-1.5 py-0.5">k (Cp/Cv)</td>
                <td className="px-1.5 py-0.5 text-right">{props.otros_datos.k_cp_cv.toFixed(3)}</td>
                <td className="px-1">-</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5">LFL (fracc. molar)</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.lfl_fracc_molar.toFixed(3)}
                </td>
                <td className="px-1">-</td>
                <td className="px-1.5 py-0.5">Cp</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.cp_kcal_kg_c.toFixed(3)}
                </td>
                <td className="px-1">kcal/kg·°C</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5">UFL (fracc. molar)</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.ufl_fracc_molar.toFixed(3)}
                </td>
                <td className="px-1">-</td>
                <td className="px-1.5 py-0.5">Cv</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.cv_kcal_kg_c.toFixed(3)}
                </td>
                <td className="px-1">kcal/kg·°C</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5"></td>
                <td className="px-1.5 py-0.5 text-right"></td>
                <td className="px-1"></td>
                <td className="px-1.5 py-0.5">Cp</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.cp_kcal_m3_c.toFixed(3)}
                </td>
                <td className="px-1">kcal/m³·°C</td>
              </tr>
              <tr>
                <td className="px-1.5 py-0.5"></td>
                <td className="px-1.5 py-0.5 text-right"></td>
                <td className="px-1"></td>
                <td className="px-1.5 py-0.5">Cv</td>
                <td className="px-1.5 py-0.5 text-right">
                  {props.otros_datos.cv_kcal_m3_c.toFixed(3)}
                </td>
                <td className="px-1">kcal/m³·°C</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BLOQUE 4: Viscosidad Gas (estimada) */}
        {(props.caracteristicas_generales.viscosidad_dean_stiel ||
          props.caracteristicas_generales.viscosidad_lucas) && (
          <div className="mx-[60px] mt-0 border border-t-0 border-black">
            <div className="border-b border-black bg-gray-100 p-0.5 text-center font-bold">
              Viscosidad Gas (estimada)
            </div>
            <table className="w-full text-[9px]">
              <tbody>
                {props.caracteristicas_generales.viscosidad_dean_stiel && (
                  <tr>
                    <td className="w-1/2 px-1.5 py-0.5">Dean & Stiel</td>
                    <td className="px-1.5 py-0.5 text-right">
                      {props.caracteristicas_generales.viscosidad_dean_stiel.value.toFixed(5)}
                    </td>
                    <td className="w-[75px] px-1">
                      {props.caracteristicas_generales.viscosidad_dean_stiel.unit}
                    </td>
                  </tr>
                )}
                {props.caracteristicas_generales.viscosidad_lucas && (
                  <tr>
                    <td className="px-1.5 py-0.5">Correl. Lucas</td>
                    <td className="px-1.5 py-0.5 text-right">
                      {props.caracteristicas_generales.viscosidad_lucas.value.toFixed(5)}
                    </td>
                    <td className="px-1">
                      {props.caracteristicas_generales.viscosidad_lucas.unit}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="px-1.5 py-0.5">Lohrenz-Bray-Clark</td>
                  <td className="px-1.5 py-0.5 text-right">-</td>
                  <td className="px-1">cP</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mx-8 mt-3 flex items-end justify-between text-[8px]">
          <div className="flex-1 text-black">
            <p>(NR) No reportada (NE) No ensayado (ND) No disponible (NS) No solicitado</p>
          </div>
          <div className="w-[180px] text-center">
            <Image
              src="/croma/firma.jpeg"
              alt="Firma"
              width={120}
              height={48}
              className="mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function DataRow({ label, value, onChange, color }: any) {
  const colorClass = color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : '';
  return (
    <div className="grid grid-cols-[130px_1fr_auto] gap-1.5">
      <span className="text-right">{label}:</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border-none bg-transparent font-bold outline-none ${colorClass}`}
        placeholder="-"
      />
      <span />
    </div>
  );
}

function DataRowWithUnit({ label, value, onChange, unit }: any) {
  return (
    <div className="grid grid-cols-[130px_1fr_auto] gap-1.5">
      <span className="text-right">{label}:</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 border-none bg-transparent text-right font-bold outline-none"
        placeholder="-"
      />
      <span className="text-black">{unit}</span>
    </div>
  );
}

function PropRow({ label, value }: any) {
  return (
    <tr>
      <td className="w-1/2 px-1.5 py-0.5">{label}</td>
      <td className="px-1.5 py-0.5 text-right">{value.value.toFixed(3)}</td>
      <td className="w-[75px] px-1">{value.unit}</td>
    </tr>
  );
}
