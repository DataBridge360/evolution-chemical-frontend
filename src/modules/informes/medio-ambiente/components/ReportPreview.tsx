'use client';

import Image from 'next/image';
import { useState } from 'react';
import { type EnvironmentReportFormData } from '../types';
import { IN_SITU_PARAMETERS, CHEMICAL_PARAMETERS, type ReportParameter } from '../constants';

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
      <td style={dataCellStyle}>{param.label}</td>
      <EditableCell
        value={unit}
        style={dataCellStyle}
        align="center"
        editable={editable}
        onCommit={onFieldChange ? (v) => onFieldChange(param.fieldName, v, 'unit') : undefined}
      />
      <EditableCell
        value={value || ''}
        style={dataCellStyle}
        align="center"
        editable={editable}
        onCommit={onFieldChange ? (v) => onFieldChange(param.fieldName, v, 'value') : undefined}
      />
      <EditableCell
        value={method}
        style={dataCellStyle}
        align="left"
        editable={editable}
        onCommit={onFieldChange ? (v) => onFieldChange(param.fieldName, v, 'method') : undefined}
      />
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
        padding: '20px 30px',
        fontFamily: "'Century Gothic', sans-serif",
        fontSize: '10px',
        color: '#000',
      }}
    >
      {/* ── Logo (rows 1-4) ─────────────────────────────────────────── */}
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

      {/* ── ISO certification text (rows 5-7) ───────────────────────── */}
      <div
        style={{
          fontSize: '8.5px',
          fontFamily: "'Century Gothic', sans-serif",
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

      {/* ── Metadata section (rows 9-15) ─────────────────────────────── */}
      <table
        style={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          marginBottom: '12px',
        }}
      >
        <tbody>
          <tr>
            <td style={metaLabelStyle}>MUESTRA DE:</td>
            <EditableCell
              value={data.sample_description || 'Agua'}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('sample_description', v) : undefined}
            />
            <td style={metaLabelStyle}>PDT</td>
            <EditableCell
              value={data.pdt || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('pdt', v) : undefined}
            />
          </tr>
          <tr>
            <td style={metaLabelStyle}>PROCEDENCIA:</td>
            <EditableCell
              value={data.origin || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('origin', v) : undefined}
            />
            <td style={metaLabelStyle}>F.INFORME</td>
            <td style={metaValueStyle}>{formatDate(data.report_date ?? '')}</td>
          </tr>
          <tr>
            <td style={metaLabelStyle}>FECHA MUESTREO:</td>
            <td style={metaValueStyle}>{formatDate(data.sample_date ?? '')}</td>
            <td style={metaLabelStyle}>N° INFORME</td>
            <EditableCell
              value={data.report_number || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('report_number', v) : undefined}
            />
          </tr>
          <tr>
            <td style={metaLabelStyle}>HORA:</td>
            <td style={metaValueStyle}>{data.sample_time}</td>
            <td style={metaLabelStyle} />
            <td style={metaValueStyle} />
          </tr>
          <tr>
            <td style={metaLabelStyle}>EXTRAIDA POR:</td>
            <EditableCell
              value={data.extracted_by || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('extracted_by', v) : undefined}
            />
          </tr>
          <tr>
            <td style={metaLabelStyle}>SOLICITADO POR:</td>
            <EditableCell
              value={data.requested_by || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('requested_by', v) : undefined}
            />
          </tr>
          <tr>
            <td style={metaLabelStyle}>ANALISIS REQUERIDO:</td>
            <EditableCell
              value={data.requested_analysis || ''}
              style={metaValueStyle}
              editable={editable}
              onCommit={onMetaChange ? (v) => onMetaChange('requested_analysis', v) : undefined}
            />
          </tr>
        </tbody>
      </table>

      {/* ── RESULTADOS title (row 17) ────────────────────────────────── */}
      <div
        style={{
          fontFamily: 'Impact, sans-serif',
          fontSize: '14px',
          fontStyle: 'italic',
          textDecoration: 'underline',
          marginBottom: '8px',
          marginTop: '4px',
          textAlign: 'center',
        }}
      >
        RESULTADOS
      </div>

      {/* ── Determinaciones In-Situ ──────────────────────────────────── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '12px',
        }}
      >
        <thead>
          <tr>
            <th style={sectionHeaderStyle}>
              Muestra sin conservante
              <br />
              Determinaciones InSitu
            </th>
            <th style={{ ...columnHeaderStyle, width: '70px' }}>Unidad</th>
            <th style={{ ...columnHeaderStyle, width: '90px' }}>Valor Obtenido</th>
            <th style={columnHeaderStyle}>Método</th>
          </tr>
        </thead>
        <tbody>
          {IN_SITU_PARAMETERS.map((param) => (
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
        </tbody>
      </table>

      {/* ── Caracteres Físicos Químicos ──────────────────────────────── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '16px',
        }}
      >
        <thead>
          <tr>
            <th style={sectionHeaderStyle}>
              Caracteres
              <br />
              Físicos Químicos
            </th>
            <th style={{ ...columnHeaderStyle, width: '70px' }}>Unidad</th>
            <th style={{ ...columnHeaderStyle, width: '90px' }}>Valor Obtenido</th>
            <th style={columnHeaderStyle}>Método</th>
          </tr>
        </thead>
        <tbody>
          {CHEMICAL_PARAMETERS.map((param) => (
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
        </tbody>
      </table>

      {/* ── Firma y Sello ────────────────────────────────────────────── */}
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

// ── Inline styles ─────────────────────────────────────────────────────────

const metaLabelStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '3px 6px',
  fontFamily: "'Century Gothic', sans-serif",
  fontSize: '9px',
  fontWeight: 'bold',
  width: '120px',
  verticalAlign: 'top',
  background: '#FFFFCC',
};

const metaValueStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '3px 6px',
  fontFamily: "'Times New Roman', serif",
  fontSize: '11px',
  fontWeight: 'bold',
  verticalAlign: 'top',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  background: '#fff',
};

const sectionHeaderStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '4px 6px',
  fontFamily: "'Century Gothic', sans-serif",
  fontSize: '10px',
  fontWeight: 'bold',
  textAlign: 'left',
  background: '#FFFFCC',
};

const columnHeaderStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '4px 6px',
  fontFamily: "'Century Gothic', sans-serif",
  fontSize: '10px',
  fontWeight: 'bold',
  textAlign: 'center',
  background: '#FFFFCC',
};

const dataCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '10px',
};
