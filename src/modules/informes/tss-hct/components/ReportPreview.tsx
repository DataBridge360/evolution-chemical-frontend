'use client';

import Image from 'next/image';
import { useState } from 'react';
import { type TssHctReportFormData, type SamplingPoint } from '../types';
import { OILFIELD_NAMES } from '../constants';

interface ReportPreviewProps {
  data: TssHctReportFormData;
  editable?: boolean;
  onPointChange?: (index: number, field: keyof SamplingPoint, value: string) => void;
  onMetaChange?: (fieldName: string, value: string) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EditableCell({
  value,
  style,
  editable,
  onCommit,
  align,
}: {
  value: string;
  style: React.CSSProperties;
  editable?: boolean;
  onCommit?: (newValue: string) => void;
  align?: 'center' | 'left';
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editable || !onCommit) {
    return <td style={{ ...style, textAlign: align }}>{value}</td>;
  }

  if (editing) {
    return (
      <td style={{ ...style, textAlign: align, padding: 0 }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft !== value) onCommit(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditing(false);
              if (draft !== value) onCommit(draft);
            }
            if (e.key === 'Escape') {
              setEditing(false);
              setDraft(value);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: '2px solid #006096',
            outlineOffset: '-1px',
            padding: '2px 4px',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            textAlign: align || 'left',
            background: '#eef6ff',
          }}
        />
      </td>
    );
  }

  return (
    <td
      style={{
        ...style,
        textAlign: align,
        cursor: 'pointer',
      }}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click para editar"
      className="hover:!bg-[#eef6ff]"
    >
      {value || <span style={{ opacity: 0.3 }}>—</span>}
    </td>
  );
}

export function ReportPreview({ data, editable, onPointChange, onMetaChange }: ReportPreviewProps) {
  const oilfieldName = OILFIELD_NAMES[data.oilfield] || data.oilfield || '';
  const procedencia = data.origin || `Yacimiento ${oilfieldName} ${data.plant || ''}`.trim();
  const includeH2s = data.include_h2s;
  const includeCo2 = data.include_co2;
  return (
    <div
      id="report-preview"
      style={{
        width: '595px',
        minWidth: '595px',
        margin: '0 auto',
        background: '#fff',
        padding: '20px 30px',
        fontFamily: 'Tahoma, sans-serif',
        fontSize: '10px',
        color: '#000',
      }}
    >
      {/* ── Logo (filas 1-6) ──────────────────────────────────────── */}
      <div style={{ marginBottom: '8px' }}>
        <Image
          src="/informes/image.png"
          alt="Evolution Chemical S.R.L."
          width={380}
          height={100}
          style={{ display: 'block' }}
          unoptimized
        />
      </div>

      {/* ── ISO certification ─────────────────────────────────────── */}
      <div
        style={{
          fontSize: '8.5px',
          fontFamily: 'Tahoma, sans-serif',
          color: '#000',
          marginBottom: '12px',
          lineHeight: 1.4,
        }}
      >
        <em>Laboratorio certificado en normas de calidad ISO 9001 / 2015</em>
        <br />
        <em>Evaluado por interlaboratoiro del COFILAB</em>
        <br />
        <em>Inscripto en el RePPSA bajo la matrícula N° 1042/25</em>
      </div>

      {/* ── Fila 7: separador fino ────────────────────────────────── */}
      <div style={{ height: '3.8px' }} />

      {/* ── Encabezado metadata (B8:G10) ──────────────────────────── */}
      <table
        style={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          marginBottom: '0',
        }}
      >
        <tbody>
          {/* Row B8/F8 */}
          <tr>
            <td style={labelStyle}>MUESTRA DE:</td>
            <EditableCell
              value={data.sample_description || 'Agua'}
              style={valueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('sample_description', v) : undefined}
            />
            <td style={labelStyle}>N° PDT</td>
            <EditableCell
              value={data.pdt || ''}
              style={valueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('pdt', v) : undefined}
            />
          </tr>
          {/* Row B9/F9 */}
          <tr>
            <td style={labelStyle}>PROCEDENCIA:</td>
            <EditableCell
              value={procedencia}
              style={valueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('origin', v) : undefined}
            />
            <td style={labelStyle}>F.INFORME</td>
            <td style={valueStyle}>{formatDate(data.report_date ?? '')}</td>
          </tr>
          {/* Row B10/F10 */}
          <tr>
            <td style={labelStyle}>FECHA{'  '}MUESTREO:</td>
            <td style={valueStyle}>{formatDate(data.sample_date ?? '')}</td>
            <td style={labelStyle}>N° INFORME</td>
            <EditableCell
              value={data.report_number || ''}
              style={valueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('report_number', v) : undefined}
            />
          </tr>
          {/* Row B11 */}
          <tr>
            <td style={labelStyle}>HORA:</td>
            <td style={valueStyle}>{data.sample_time || 'No Reportada'}</td>
            <td style={labelStyle} />
            <td style={valueStyle} />
          </tr>
          {/* Row B12 */}
          <tr>
            <td style={labelStyle}>EXTRAIDA POR:</td>
            <EditableCell
              value={data.extracted_by || 'Evolution Chemical SRL'}
              style={valueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('extracted_by', v) : undefined}
            />
            <td style={labelStyle} />
            <td style={valueStyle} />
          </tr>
          {/* Row B13 */}
          <tr>
            <td style={labelStyle}>SOLICITADO POR:</td>
            <EditableCell
              value={data.requested_by || ''}
              style={valueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('requested_by', v) : undefined}
            />
            <td style={labelStyle} />
            <td style={valueStyle} />
          </tr>
          {/* Row B14 */}
          <tr>
            <td style={labelStyle}>ANALISIS REQUERIDO:</td>
            <EditableCell
              value={data.requested_analysis || ''}
              style={{ ...valueStyle, whiteSpace: 'normal' }}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('requested_analysis', v) : undefined}
            />
            <td style={labelStyle} />
            <td style={valueStyle} />
          </tr>
        </tbody>
      </table>

      {/* ── RESULTADOS (B16:G16) ──────────────────────────────────── */}
      <div
        style={{
          fontFamily: 'Impact, sans-serif',
          fontSize: '14px',
          textAlign: 'center',
          padding: '8px 0',
          marginTop: '12px',
          borderTop: '1px solid #000',
          verticalAlign: 'middle',
        }}
      >
        RESULTADOS
      </div>

      {/* ── Tabla de resultados (fila 18+) ────────────────────────── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '8px',
        }}
      >
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Muestras</th>
            <th style={tableHeaderStyle}>TSS mg/L</th>
            <th style={tableHeaderStyle}>HcT EPA 418.1 mg/L</th>
            {includeH2s && <th style={tableHeaderStyle}>H2S disuelto mg/L</th>}
            {includeCo2 && <th style={tableHeaderStyle}>CO2 disuelto mg/L</th>}
          </tr>
        </thead>
        <tbody>
          {(data.sampling_points || []).map((point, index) => {
            const hasData = point.name || point.tss || point.hct || point.h2s || point.co2;
            if (!hasData && !editable) return null;
            return (
              <tr key={index}>
                <EditableCell
                  value={point.name || ''}
                  style={dataCellStyle}
                  align="center"
                  editable={editable}
                  onCommit={onPointChange ? (v) => onPointChange(index, 'name', v) : undefined}
                />
                <EditableCell
                  value={point.tss || ''}
                  style={dataCellStyle}
                  align="center"
                  editable={editable}
                  onCommit={onPointChange ? (v) => onPointChange(index, 'tss', v) : undefined}
                />
                <EditableCell
                  value={point.hct || ''}
                  style={dataCellStyle}
                  align="center"
                  editable={editable}
                  onCommit={onPointChange ? (v) => onPointChange(index, 'hct', v) : undefined}
                />
                {includeH2s && (
                  <EditableCell
                    value={point.h2s || ''}
                    style={dataCellStyle}
                    align="center"
                    editable={editable}
                    onCommit={onPointChange ? (v) => onPointChange(index, 'h2s', v) : undefined}
                  />
                )}
                {includeCo2 && (
                  <EditableCell
                    value={point.co2 || ''}
                    style={dataCellStyle}
                    align="center"
                    editable={editable}
                    onCommit={onPointChange ? (v) => onPointChange(index, 'co2', v) : undefined}
                  />
                )}
              </tr>
            );
          })}
          {/* Empty rows to fill the template look */}
          {(data.sampling_points || []).length < 5 &&
            Array.from({ length: 5 - (data.sampling_points || []).length }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={dataCellStyle}>&nbsp;</td>
                <td style={dataCellStyle}>&nbsp;</td>
                <td style={dataCellStyle}>&nbsp;</td>
                {includeH2s && <td style={dataCellStyle}>&nbsp;</td>}
                {includeCo2 && <td style={dataCellStyle}>&nbsp;</td>}
              </tr>
            ))}
        </tbody>
      </table>

      {/* ── Zona firma/leyenda (D25:E28 vacías) ──────────────────── */}
      <div style={{ height: '120px' }} />

      {/* ── Firma y Sello ─────────────────────────────────────────── */}
      <div style={{ textAlign: 'right', marginTop: '24px' }}>
        <Image
          src="/informes/firma_sello.jpeg"
          alt="Firma y Sello"
          width={165}
          height={130}
          style={{ display: 'inline-block' }}
          unoptimized
        />
      </div>
    </div>
  );
}

// ── Inline styles matching the spec ──────────────────────────────────────────

/** Rótulos encabezado: Tahoma 10 normal, fondo #F5F5F5, borde thin sup/izq */
const labelStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  borderWidth: '1px 0 0 1px',
  padding: '3px 6px',
  fontFamily: 'Tahoma, sans-serif',
  fontSize: '10px',
  fontWeight: 'normal',
  width: '120px',
  verticalAlign: 'top',
  background: '#F5F5F5',
  whiteSpace: 'nowrap',
};

/** Valores encabezado: Tahoma 10 negrita, sin relleno */
const valueStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  borderWidth: '1px 1px 0 0',
  padding: '3px 6px',
  fontFamily: 'Tahoma, sans-serif',
  fontSize: '10px',
  fontWeight: 'bold',
  verticalAlign: 'top',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  background: '#fff',
};

/** Encabezados tabla: Verdana 9 negrita, fondo #F5F5F5, centrado, wrap, bordes thin */
const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '4px 6px',
  fontFamily: 'Verdana, sans-serif',
  fontSize: '9px',
  fontWeight: 'bold',
  textAlign: 'center',
  verticalAlign: 'middle',
  background: '#F5F5F5',
  whiteSpace: 'normal',
  wordWrap: 'break-word',
};

/** Celdas de datos: Arial 10, centrado, sin relleno, bordes thin */
const dataCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '4px 6px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '10px',
  textAlign: 'center',
  verticalAlign: 'middle',
};
