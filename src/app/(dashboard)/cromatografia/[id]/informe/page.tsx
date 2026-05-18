/**
 * Página de previsualización del informe HTML de cromatografía
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAnalysis } from '@/src/modules/chromatography/services/chromatographyService';
import { ChromatographicAnalysis } from '@/src/modules/chromatography/types';

interface Props {
  params: { id: string };
}

export default function InformePage({ params }: Props) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ChromatographicAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadAnalysis();
  }, [params.id]);

  const loadAnalysis = async () => {
    try {
      const data = await getAnalysis(params.id);
      setAnalysis(data);

      // Cargar datos en los campos editables
      setReportNumber(data.report_number || '');
      setPdt('');
      setOperator(data.chromatograph_operator || '');
      setOrigin(data.sample_point || '');
      setField(data.field_name || '');
      setCompany(data.company_name || '');
      setDataDate('');
      setReportDate(data.analysis_date || '');
      setPressure(data.operating_pressure_kpa?.toString() || 'NR');
      setTemperature(data.operating_temperature_c?.toString() || 'NR');
      setFlowRate(data.flow_rate?.toString() || 'NR');
      setZone('');
      setFormation('');
      setSampledBy('');
      setSampleDate(data.sample_date || '');
      setLastCalibration('');

      if (!data.calculated_properties) {
        setError('El informe no ha sido calculado aún. Por favor, calcula las propiedades primero.');
      }
    } catch (err: any) {
      console.error('Error loading analysis:', err);
      setError(err.message || 'Error cargando análisis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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

  // Generar HTML del informe con campos editables
  const generateReportHTML = () => {
    const components = props.composicion.filter(c => c.name?.toUpperCase() !== 'TOTALES');
    let componentRows = '';
    components.forEach(comp => {
      componentRows += `
        <tr>
          <td class="name">${comp.name} (${comp.formula})</td>
          <td class="num">${comp.pct_molar.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
          <td class="num">${comp.pct_volumen.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
          <td class="num">${comp.pct_masa.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
        </tr>
      `;
    });

    if (props.totales) {
      componentRows += `
        <tr class="total">
          <td class="name" style="text-align:center;">TOTALES</td>
          <td class="num">${props.totales.pct_molar.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
          <td class="num">${props.totales.pct_volumen.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
          <td class="num">${props.totales.pct_masa.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
        </tr>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte - Cromatografia Extendida</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #e9e9e9;
    margin: 0;
    padding: 24px;
    color: #000;
  }
  .toolbar {
    max-width: 850px;
    margin: 0 auto 16px;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .toolbar button {
    background: #1a5fb4;
    color: #fff;
    border: none;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 4px;
    cursor: pointer;
  }
  .toolbar button:hover { background: #134a8e; }

  .page {
    width: 850px;
    min-height: 1100px;
    background: #fff;
    margin: 0 auto;
    padding: 20px 30px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-size: 11px;
    line-height: 1.25;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #000;
    padding-bottom: 6px;
  }
  .header .logo-block { flex: 1; }
  .logo-text {
    font-family: 'Trebuchet MS', sans-serif;
    font-size: 38px;
    font-weight: bold;
    color: #1ea5e0;
    letter-spacing: 1px;
    display: inline-block;
    position: relative;
  }
  .logo-text .chem {
    font-size: 13px;
    color: #555;
    letter-spacing: 2px;
    display: block;
    text-align: right;
    margin-top: -8px;
    margin-right: 4px;
  }
  .iso-line {
    font-style: italic;
    font-size: 11px;
    margin-top: 4px;
    font-weight: bold;
  }
  .qr-block {
    width: 90px;
    height: 90px;
    background:
      linear-gradient(45deg, #e9468a 25%, transparent 25%) 0 0/8px 8px,
      linear-gradient(-45deg, #e9468a 25%, transparent 25%) 0 0/8px 8px,
      #fff;
    border: 2px solid #fff;
    position: relative;
  }
  .qr-block::before, .qr-block::after {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    background: #fff;
    border: 4px solid #e9468a;
  }
  .qr-block::before { top: 4px; left: 4px; }
  .qr-block::after { top: 4px; right: 4px; }

  .title-bar {
    border-bottom: 2px solid #000;
    text-align: center;
    padding: 4px 0;
    margin-top: 4px;
  }
  .title-bar h1 {
    margin: 0;
    font-size: 18px;
    font-weight: normal;
    font-family: 'Times New Roman', Times, serif;
  }

  .header-data {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 30px;
    padding: 10px 30px 6px;
    font-size: 11px;
  }
  .header-data .row {
    display: grid;
    grid-template-columns: 130px 1fr auto;
    column-gap: 6px;
    margin-bottom: 2px;
  }
  .header-data .label { text-align: right; }
  .header-data .value { font-weight: bold; }
  .header-data .value.red { color: #e63d3d; }
  .header-data .value.blue { color: #1a5fb4; }
  .header-data .unit { color: #000; }

  /* Input editable */
  .editable-input {
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    font-weight: bold;
    padding: 0;
    margin: 0;
    width: 100%;
    outline: none;
  }
  .editable-input:focus {
    background: #ffffcc;
    border-bottom: 1px solid #1a5fb4;
  }

  .vertical-note {
    position: absolute;
    left: 8px;
    top: 340px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 8.5px;
    color: #444;
    max-height: 600px;
    line-height: 1.4;
  }

  .components-wrapper {
    margin: 12px 60px 0 60px;
  }
  table.components {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
    font-size: 11px;
  }
  table.components th {
    background: #cfe8c8;
    border: 1px solid #000;
    padding: 4px 6px;
    text-align: center;
    font-weight: bold;
  }
  table.components th:first-child { background: #cfe8c8; }
  table.components td {
    border-left: 1px solid #000;
    border-right: 1px solid #000;
    padding: 2px 8px;
  }
  table.components td.name { text-align: left; }
  table.components td.num { text-align: right; }
  table.components tr.total td {
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    font-weight: bold;
    background: #f0f0f0;
  }

  .lower-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    margin: 10px 60px 0 60px;
  }
  .box {
    border: 1px solid #000;
    border-top: none;
  }
  .box.first-row { border-top: 1px solid #000; }
  .box .box-title {
    background: #f0f0f0;
    text-align: center;
    font-weight: bold;
    padding: 3px;
    border-bottom: 1px solid #000;
  }
  .box table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .box table td {
    padding: 2px 6px;
  }
  .box table td.lbl { width: 50%; }
  .box table td.val { text-align: right; font-weight: normal; }
  .box table td.unit { width: 75px; padding-left: 4px; }

  .box.left { border-right: none; }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin: 30px 30px 0;
    font-size: 10px;
  }
  .footer .legend {
    font-size: 10px;
    color: #000;
    flex: 1;
  }
  .signature {
    text-align: center;
    width: 280px;
  }

  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .page { box-shadow: none; margin: 0; }
    .editable-input:focus {
      background: transparent;
      border-bottom: none;
    }
  }
</style>
</head>
<body>

<div class="toolbar">
  <button onclick="window.print()">Imprimir</button>
</div>

<div class="page" id="report">

  <div class="header">
    <div class="logo-block">
      <img src="/croma/image.png" alt="Evolution Chemical" style="height:70px; display:block;" />
      <div class="iso-line">Laboratorio Certificado en Normas de Calidad ISO 9001 / 2015 por Bureau Veritas.</div>
    </div>
    <div class="qr-block"></div>
  </div>

  <div class="title-bar">
    <h1>Reporte - Cromatografia Extendida</h1>
  </div>

  <div class="header-data">
    <div>
      <div class="row"><span class="label">Informe N°:</span><span class="value red"><input type="text" class="editable-input" id="reportNumber" value="${reportNumber}" /></span><span></span></div>
      <div class="row"><span class="label">PdT:</span><span class="value"><input type="text" class="editable-input" id="pdt" value="${pdt}" /></span><span></span></div>
      <div class="row"><span class="label">Operador:</span><span class="value"><input type="text" class="editable-input" id="operator" value="${operator}" /></span><span></span></div>
      <div class="row"><span class="label">Procedencia:</span><span class="value red"><input type="text" class="editable-input" id="origin" value="${origin}" /></span><span></span></div>
      <div class="row"><span class="label">Yacimiento:</span><span class="value blue"><input type="text" class="editable-input" id="field" value="${field}" /></span><span></span></div>
      <div class="row"><span class="label">Empresa:</span><span class="value blue"><input type="text" class="editable-input" id="company" value="${company}" /></span><span></span></div>
      <div class="row"><span class="label">Datos adq.:</span><span class="value"><input type="text" class="editable-input" id="dataDate" value="${dataDate}" /></span><span></span></div>
      <div class="row"><span class="label">Fecha Inf.:</span><span class="value"><input type="text" class="editable-input" id="reportDate" value="${reportDate}" /></span><span></span></div>
      <div class="row"><span class="label">Otros datos:</span><span></span><span></span></div>
    </div>
    <div>
      <div class="row"><span class="label">Pres.:</span><span class="value"><input type="text" class="editable-input" id="pressure" value="${pressure}" style="width:60px;" /></span><span class="unit">Kg/cm2</span></div>
      <div class="row"><span class="label">Temp.:</span><span class="value"><input type="text" class="editable-input" id="temperature" value="${temperature}" style="width:60px;" /></span><span class="unit">ºC</span></div>
      <div class="row"><span class="label">Caudal</span><span class="value"><input type="text" class="editable-input" id="flowRate" value="${flowRate}" /></span><span></span></div>
      <div class="row"><span class="label">Zona:</span><span class="value"><input type="text" class="editable-input" id="zone" value="${zone}" /></span><span></span></div>
      <div class="row"><span class="label">Formacion:</span><span class="value"><input type="text" class="editable-input" id="formation" value="${formation}" /></span><span></span></div>
      <div class="row"><span class="label">Muestra Extraida por:</span><span class="value"><input type="text" class="editable-input" id="sampledBy" value="${sampledBy}" /></span><span></span></div>
      <div class="row"><span class="label">Fecha muestreo:</span><span class="value"><input type="text" class="editable-input" id="sampleDate" value="${sampleDate}" /></span><span></span></div>
      <div class="row"><span class="label">Ultima calibracion:</span><span class="value"><input type="text" class="editable-input" id="lastCalibration" value="${lastCalibration}" /></span><span></span></div>
    </div>
  </div>

  <div class="vertical-note">
    Datos, constantes y formulas tomadas de las normas IRAM-IAPG A 6854 - GPSA Electronic Data Book SI Version - Eleventh Edition GPA Standard 2145-03 - GPA Standard 2286-95. Cálculos efectuados a 1 atm. Y 15ºC - Basado en ASTM D-1945
  </div>

  <div class="components-wrapper">
    <table class="components">
      <thead>
        <tr>
          <th style="width:42%">Componente</th>
          <th style="width:19%">% Molar</th>
          <th style="width:19%">% Volumen</th>
          <th style="width:20%">% Masa</th>
        </tr>
      </thead>
      <tbody>
        ${componentRows}
      </tbody>
    </table>
  </div>

  <div class="lower-grid">
    <div class="box first-row left">
      <div class="box-title">Caracteristicas Generales</div>
      <table>
        <tr><td class="lbl">Masa Molecular</td><td class="val">${props.caracteristicas_generales.masa_molecular.value.toFixed(3)}</td><td class="unit">${props.caracteristicas_generales.masa_molecular.unit}</td></tr>
        <tr><td class="lbl">Volumen Molar</td><td class="val">${props.caracteristicas_generales.volumen_molar.value.toFixed(3)}</td><td class="unit">${props.caracteristicas_generales.volumen_molar.unit}</td></tr>
        <tr><td class="lbl">Densidad Relativa (aire = 1)</td><td class="val">${props.caracteristicas_generales.densidad_relativa.value.toFixed(3)}</td><td class="unit"></td></tr>
        <tr><td class="lbl">Densidad Absoluta</td><td class="val">${props.caracteristicas_generales.densidad_absoluta.value.toFixed(3)}</td><td class="unit"></td></tr>
        <tr><td class="lbl">Poder Cal. Superior</td><td class="val">${props.caracteristicas_generales.pcs.value.toFixed(3)}</td><td class="unit">${props.caracteristicas_generales.pcs.unit}</td></tr>
        <tr><td class="lbl">Poder Cal. Inferior</td><td class="val">${props.caracteristicas_generales.pci.value.toFixed(3)}</td><td class="unit">${props.caracteristicas_generales.pci.unit}</td></tr>
        <tr><td class="lbl">F. Compresibilidad</td><td class="val">${props.caracteristicas_generales.f_compresibilidad.value.toFixed(3)}</td><td class="unit"></td></tr>
        <tr><td class="lbl">Indice de Wobbe</td><td class="val">${props.caracteristicas_generales.indice_wobbe.value.toFixed(3)}</td><td class="unit"></td></tr>
        <tr><td class="lbl">Contenido de H₂S &nbsp;&nbsp; NE</td><td class="val"></td><td class="unit">ppm,v (*)</td></tr>
      </table>
    </div>
    <div class="box first-row">
      <div class="box-title">Propiedades Criticas</div>
      <table>
        <tr><td class="lbl">Temp. Critica</td><td class="val">${props.propiedades_criticas.tc.value_k.toFixed(3)}</td><td class="unit">°K</td></tr>
        <tr><td class="lbl">Temp. Critica Corr.</td><td class="val">${props.propiedades_criticas.tc_corr.value_k.toFixed(3)}</td><td class="unit">°K</td></tr>
        <tr><td class="lbl">Presion Critica</td><td class="val">${props.propiedades_criticas.pc.value_kpa.toFixed(3)}</td><td class="unit">kPa</td></tr>
        <tr><td class="lbl">Presion Critica Corr.</td><td class="val">${props.propiedades_criticas.pc_corr.value_kpa.toFixed(3)}</td><td class="unit">kPa</td></tr>
        <tr><td class="lbl">Volumen Critico</td><td class="val">${props.propiedades_criticas.vc.value.toFixed(3)}</td><td class="unit">${props.propiedades_criticas.vc.unit}</td></tr>
        <tr><td class="lbl">Compres. Critica</td><td class="val">${props.propiedades_criticas.zc.value.toFixed(3)}</td><td class="unit"></td></tr>
        <tr><td class="lbl">Punto Congelam.</td><td class="val">${props.propiedades_criticas.t_congelamiento.value_k.toFixed(3)}</td><td class="unit">°K</td></tr>
        <tr><td class="lbl">Punto Ebullicion</td><td class="val">${props.propiedades_criticas.t_ebullicion.value_k.toFixed(3)}</td><td class="unit">°K</td></tr>
        <tr><td class="lbl">&nbsp;</td><td class="val"></td><td class="unit"></td></tr>
      </table>
    </div>

    <div class="box left">
      <div class="box-title">Volumen de liquido equivalente</div>
      <table>
        <tr><td class="lbl">C₁+</td><td class="val">${props.volumen_liquido_eq.c1_plus.toFixed(3)}</td><td class="unit">${props.volumen_liquido_eq.unit}</td></tr>
        <tr><td class="lbl">C₂+</td><td class="val">${props.volumen_liquido_eq.c2_plus.toFixed(3)}</td><td class="unit">${props.volumen_liquido_eq.unit}</td></tr>
        <tr><td class="lbl">C₃+</td><td class="val">${props.volumen_liquido_eq.c3_plus.toFixed(3)}</td><td class="unit">${props.volumen_liquido_eq.unit}</td></tr>
        <tr><td class="lbl">C₄+</td><td class="val">${props.volumen_liquido_eq.c4_plus.toFixed(3)}</td><td class="unit">${props.volumen_liquido_eq.unit}</td></tr>
        <tr><td class="lbl">C₅+</td><td class="val">${props.volumen_liquido_eq.c5_plus.toFixed(3)}</td><td class="unit">${props.volumen_liquido_eq.unit}</td></tr>
      </table>
    </div>
    <div class="box">
      <div class="box-title">Porcentual de composicion</div>
      <table>
        <tr><td class="lbl">Oxigeno</td><td class="val">${props.composicion_porcentual.oxigeno.toFixed(2)}</td><td class="unit">%</td></tr>
        <tr><td class="lbl">Nitrogeno</td><td class="val">${props.composicion_porcentual.nitrogeno.toFixed(2)}</td><td class="unit">%</td></tr>
        <tr><td class="lbl">Carbono</td><td class="val">${props.composicion_porcentual.carbono.toFixed(2)}</td><td class="unit">%</td></tr>
        <tr><td class="lbl">Hidrogeno</td><td class="val">${props.composicion_porcentual.hidrogeno.toFixed(2)}</td><td class="unit">%</td></tr>
        <tr><td class="lbl">Relacion C-H</td><td class="val">${props.composicion_porcentual.ratio_c_h.toFixed(2)}</td><td class="unit"></td></tr>
      </table>
    </div>

    <div class="box left">
      <div class="box-title">Otros Datos</div>
      <table>
        <tr><td class="lbl">Aire req. p/comb.</td><td class="val">${props.otros_datos.aire_combustion.value.toFixed(3)}</td><td class="unit">${props.otros_datos.aire_combustion.unit}</td></tr>
        <tr><td class="lbl">Limite Infl. Inferior</td><td class="val">${props.otros_datos.lfl.value.toFixed(3)}</td><td class="unit">% Vol.</td></tr>
        <tr><td class="lbl">Limite Infl. Superior</td><td class="val">${props.otros_datos.ufl.value.toFixed(3)}</td><td class="unit">% Vol.</td></tr>
        <tr><td class="lbl">Cp</td><td class="val">${props.otros_datos.cp_kj_kg_k.toFixed(3)}</td><td class="unit">kJ/(kg ºK)</td></tr>
        <tr><td class="lbl">Cv</td><td class="val">${props.otros_datos.cv_kj_kg_k.toFixed(3)}</td><td class="unit">kJ/(kg ºK)</td></tr>
        <tr><td class="lbl">K=Cp/Cv</td><td class="val">${props.otros_datos.k_cp_cv.toFixed(3)}</td><td class="unit"></td></tr>
      </table>
    </div>
    <div class="box">
      <div class="box-title">Viscosidad Gas (estimada)</div>
      <table>
        <tr><td class="lbl">Dean &amp; Stiel</td><td class="val"></td><td class="unit">cP</td></tr>
        <tr><td class="lbl">Correl. Lucas</td><td class="val"></td><td class="unit">cP</td></tr>
        <tr><td class="lbl">Lohrenz-Bray-Clark</td><td class="val"></td><td class="unit">cP</td></tr>
        <tr><td class="lbl">&nbsp;</td><td class="val"></td><td class="unit"></td></tr>
        <tr><td class="lbl">&nbsp;</td><td class="val"></td><td class="unit"></td></tr>
        <tr><td class="lbl">&nbsp;</td><td class="val"></td><td class="unit"></td></tr>
      </table>
    </div>
  </div>

  <div class="footer">
    <div class="legend">(NR) No reportada (NE) No ensayado (ND) No disponible (NS) No solicitado - (*) 1 ppm H₂S = 1.42 mg/m³</div>
    <div class="signature">
      <img src="/croma/firma.jpeg" alt="Firma" style="width:200px; display:block; margin:0 auto;" />
    </div>
  </div>
</div>

</body>
</html>
    `;
  };

  return (
    <div dangerouslySetInnerHTML={{ __html: generateReportHTML() }} />
  );
}
