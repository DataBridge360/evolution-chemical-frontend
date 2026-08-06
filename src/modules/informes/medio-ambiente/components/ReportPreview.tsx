'use client';

import Image from 'next/image';
import { useState } from 'react';
import { type EnvironmentReportFormData } from '../types';
import { ALL_PARAMETERS, type ReportParameter } from '../constants';

interface ReportPreviewProps {
  data: EnvironmentReportFormData;
  editable?: boolean;
  onFieldChange?: (fieldName: string, value: string, type: 'value' | 'unit' | 'method') => void;
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
  colSpan,
}: {
  value: string;
  style: React.CSSProperties;
  editable?: boolean;
  onCommit?: (newValue: string) => void;
  align?: 'center' | 'left';
  colSpan?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editable || !onCommit) {
    return (
      <td colSpan={colSpan} style={{ ...style, textAlign: align }}>
        {value}
      </td>
    );
  }

  if (editing) {
    return (
      <td colSpan={colSpan} style={{ ...style, textAlign: align, padding: 0 }}>
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
      colSpan={colSpan}
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
      {value || <span style={{ opacity: 0.3 }}>&mdash;</span>}
    </td>
  );
}

function ParameterRow({
  param,
  value,
  unit,
  method,
  editable,
  onFieldChange,
}: {
  param: ReportParameter;
  value: string;
  unit: string;
  method: string;
  editable?: boolean;
  onFieldChange?: (fieldName: string, value: string, type: 'value' | 'unit' | 'method') => void;
}) {
  return (
    <tr>
      <td style={{ border: 'none' }} />
      <td colSpan={2} style={{ ...dataCellStyle, fontWeight: 'bold', textAlign: 'center' }}>
        {param.label}
      </td>
      <EditableCell
        value={value || ''}
        style={dataCellStyle}
        align="center"
        editable={editable}
        onCommit={onFieldChange ? (v) => onFieldChange(param.fieldName, v, 'value') : undefined}
      />
      <EditableCell
        value={unit}
        style={dataCellStyle}
        align="center"
        editable={editable}
        onCommit={onFieldChange ? (v) => onFieldChange(param.fieldName, v, 'unit') : undefined}
        colSpan={2}
      />
      <EditableCell
        value={method}
        style={dataCellStyle}
        align="center"
        editable={editable}
        onCommit={onFieldChange ? (v) => onFieldChange(param.fieldName, v, 'method') : undefined}
      />
      <td style={{ border: 'none' }} />
    </tr>
  );
}

export function ReportPreview({ data, editable, onFieldChange, onMetaChange }: ReportPreviewProps) {
  return (
    <div
      id="report-preview"
      style={{
        width: '595px',
        minWidth: '595px',
        margin: '0 auto',
        background: '#fff',
        padding: '20px 24px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#000',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '19%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <tbody>
          {/* ── Header: Logo + Side Labels (rows 1-5) ─────────────── */}
          <tr>
            <td
              colSpan={6}
              rowSpan={5}
              style={{ border: 'none', padding: 0, verticalAlign: 'top', position: 'relative' }}
            >
              <Image
                src="/informes/logo_banner_kompass.jpg"
                alt="KOMPASS S.A."
                width={380}
                height={85}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '95px',
                  objectFit: 'contain',
                  objectPosition: 'left',
                }}
                unoptimized
              />
              <Image
                src="/informes/logo_reppsa_chico.jpg"
                alt="RePPSA"
                width={50}
                height={50}
                style={{ position: 'absolute', top: '4px', right: '8px' }}
                unoptimized
              />
            </td>
            <td style={{ border: 'none', height: '13px' }} />
            <td style={{ border: 'none', height: '13px' }} />
          </tr>
          <tr>
            <td style={sideLabelStyle}>PDT</td>
            <EditableCell
              value={data.pdt || ''}
              style={sideValueStyle}
              align="center"
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('pdt', v) : undefined}
            />
          </tr>
          <tr>
            <td style={sideLabelStyle}>Fecha de informe</td>
            <td style={sideValueStyle}>{formatDate(data.report_date ?? '')}</td>
          </tr>
          <tr>
            <td style={sideLabelStyle}>N&#176;Informe</td>
            <EditableCell
              value={data.report_number || ''}
              style={sideValueStyle}
              align="center"
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('report_number', v) : undefined}
            />
          </tr>
          <tr>
            <td style={sideLabelStyle}>Matricula RePPSA</td>
            <td style={sideValueStyle}>1042/25</td>
          </tr>

          {/* ── Row 6: Solicitado por ─────────────────────────────── */}
          <tr style={{ height: '24px' }}>
            <td style={{ ...metaLabelStyle, textAlign: 'center', verticalAlign: 'center' }}>
              Solicitado por:
            </td>
            <EditableCell
              value={data.requested_by || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('requested_by', v) : undefined}
              colSpan={7}
            />
          </tr>

          {/* ── Row 7: Direccion ──────────────────────────────────── */}
          <tr style={{ height: '22px' }}>
            <td style={{ ...metaLabelStyle, textAlign: 'center', verticalAlign: 'center' }}>
              Direccion:
            </td>
            <td colSpan={7} style={metaValueStyle} />
          </tr>

          {/* ── Row 8: Muestra de / Fecha de Ingreso ──────────────── */}
          <tr>
            <td style={metaLabelStyle}>Muestra de:</td>
            <EditableCell
              value={data.sample_description || 'Agua'}
              style={{ ...metaValueStyle, textAlign: 'center' }}
              align="center"
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('sample_description', v) : undefined}
              colSpan={3}
            />
            <td colSpan={2} style={{ ...metaLabelStyle, textAlign: 'left' }}>
              Fecha de Ingreso:
            </td>
            <td colSpan={2} style={{ ...metaValueStyle, textAlign: 'center' }}>
              {formatDate(data.report_date ?? '')}
            </td>
          </tr>

          {/* ── Row 9: Procedencia / Fecha de muestreo ────────────── */}
          <tr>
            <td style={metaLabelStyle}>Procedencia:</td>
            <EditableCell
              value={data.origin || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('origin', v) : undefined}
              colSpan={3}
            />
            <td colSpan={2} style={{ ...metaLabelStyle, textAlign: 'left' }}>
              Fecha de muestreo
            </td>
            <td colSpan={2} style={{ ...metaValueStyle, textAlign: 'center' }}>
              {formatDate(data.sample_date ?? '')}
            </td>
          </tr>

          {/* ── Row 10: Extraida por / Hora de muestreo ───────────── */}
          <tr>
            <td style={metaLabelStyle}>Extraida por:</td>
            <EditableCell
              value={data.extracted_by || ''}
              style={{ ...metaValueStyle, textAlign: 'center' }}
              align="center"
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('extracted_by', v) : undefined}
              colSpan={3}
            />
            <td colSpan={2} style={{ ...metaLabelStyle, textAlign: 'left' }}>
              Hora de muestreo:
            </td>
            <td colSpan={2} style={{ ...metaValueStyle, textAlign: 'center' }}>
              {data.sample_time || ''}
            </td>
          </tr>

          {/* ── Row 11: Analisis Requerido ─────────────────────────── */}
          <tr>
            <td
              colSpan={3}
              style={{
                ...metaLabelStyle,
                textAlign: 'center',
                verticalAlign: 'middle',
                height: '50px',
                whiteSpace: 'normal',
              }}
            >
              Analisis Requerido
              <br />
              <span style={{ fontWeight: 'normal' }}>(Metodo Analitico/instrumental)</span>
            </td>
            <EditableCell
              value={data.requested_analysis || ''}
              style={{ ...metaValueStyle, verticalAlign: 'middle' }}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('requested_analysis', v) : undefined}
              colSpan={5}
            />
          </tr>

          {/* ── Row 12: Resultados ─────────────────────────────────── */}
          <tr>
            <td
              colSpan={8}
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                textAlign: 'center',
                border: '1px solid #000',
                padding: '6px',
                background: PEACH_FILL,
                height: '25px',
              }}
            >
              Resultados
            </td>
          </tr>

          {/* ── Row 13: Table headers ──────────────────────────────── */}
          <tr style={{ height: '50px' }}>
            <td style={{ border: 'none' }} />
            <td colSpan={2} style={tableHeaderStyle}>
              Analisis
            </td>
            <td style={tableHeaderStyle}>Resultado</td>
            <td colSpan={2} style={tableHeaderStyle}>
              Unidad
            </td>
            <td style={tableHeaderStyle}>M&#233;todo</td>
            <td style={{ border: 'none' }} />
          </tr>

          {/* ── Data rows: all parameters unified ──────────────────── */}
          {ALL_PARAMETERS.map((param) => (
            <ParameterRow
              key={param.fieldName}
              param={param}
              value={(data[param.fieldName as keyof EnvironmentReportFormData] as string) ?? ''}
              unit={data._units?.[param.fieldName] ?? param.unit}
              method={data._methods?.[param.fieldName] ?? param.method}
              editable={editable}
              onFieldChange={onFieldChange}
            />
          ))}

          {/* ── Notes ──────────────────────────────────────────────── */}
          <tr>
            <td
              colSpan={8}
              style={{
                padding: '4px 6px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                border: 'none',
                textAlign: 'left',
              }}
            >
              NS: No se detecta
            </td>
          </tr>
          <tr>
            <td
              colSpan={8}
              style={{
                padding: '2px 6px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                border: 'none',
                textAlign: 'left',
              }}
            >
              NOTA: Temperatura/Oxigeno disuelto insitu medido por Kompass SA
            </td>
          </tr>

          {/* ── Spacer ─────────────────────────────────────────────── */}
          <tr>
            <td colSpan={8} style={{ height: '20px', border: 'none' }} />
          </tr>

          {/* ── Signature blocks ───────────────────────────────────── */}
          <tr>
            <td
              colSpan={4}
              style={{
                border: '1px solid #000',
                height: '130px',
                textAlign: 'center',
                verticalAlign: 'bottom',
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                whiteSpace: 'pre-line',
                padding: '8px',
              }}
            >
              {'KOMPASS SA\nEncargado del Muestreo'}
            </td>
            <td
              colSpan={4}
              style={{
                border: '1px solid #000',
                borderLeft: 'none',
                height: '130px',
                textAlign: 'center',
                verticalAlign: 'top',
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                padding: '8px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <Image
                  src="/informes/firma_sello.jpeg"
                  alt="Firma y Sello"
                  width={120}
                  height={100}
                  style={{ display: 'block' }}
                  unoptimized
                />
                <span>Responsable Tecnico/ encargado del Analisis</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────

const PEACH_FILL = '#FDE9D9';

const sideLabelStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '11px',
  fontWeight: 'bold',
  textAlign: 'center',
  verticalAlign: 'middle',
  background: PEACH_FILL,
  height: '16px',
};

const sideValueStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  textAlign: 'center',
  verticalAlign: 'middle',
  background: '#fff',
  height: '16px',
};

const metaLabelStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '3px 6px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '10px',
  fontWeight: 'bold',
  verticalAlign: 'middle',
  background: PEACH_FILL,
};

const metaValueStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '3px 6px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '10px',
  verticalAlign: 'middle',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  background: '#fff',
};

const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '4px 6px',
  fontFamily: 'Calibri, sans-serif',
  fontSize: '11px',
  fontWeight: 'bold',
  textAlign: 'center',
  verticalAlign: 'middle',
  background: PEACH_FILL,
};

const dataCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '10px',
  height: '20px',
  verticalAlign: 'middle',
};
