'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Sample } from '@/src/types/sample';

interface SampleLabelModalProps {
  sample: Sample;
  onClose: () => void;
}

export function SampleLabelModal({ sample, onClose }: SampleLabelModalProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Etiqueta-${sample.internal_code}`,
    pageStyle: `
      @page {
        size: 80mm 50mm landscape;
        margin: 0mm;
      }
    `,
    onAfterPrint: () => {
      console.log('Impresión completada');
    },
  });

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm 50mm landscape;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .label-to-print,
          .label-to-print * {
            visibility: visible;
          }
          .label-to-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            height: 50mm !important;
            font-size: 7pt !important;
          }
          .label-to-print .label-left {
            padding: 2mm !important;
          }
          .label-to-print .label-right {
            padding: 2mm !important;
            gap: 1mm !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Etiqueta de Muestra</h2>
            <button
              onClick={onClose}
              className="text-2xl leading-none text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6">
            {/* Instructions */}
            <div className="border border-blue-200 bg-blue-50 p-4">
              <p className="mb-2 text-sm font-medium text-blue-900">
                Muestra creada exitosamente con código:{' '}
                <span className="font-bold">{sample.internal_code}</span>
              </p>
              <p className="text-sm text-blue-800">
                Imprime esta etiqueta (8cm x 5cm) y pégala en el frasco de muestra antes de enviarlo
                al laboratorio.
              </p>
            </div>

            {/* Label Preview */}
            <div className="flex justify-center">
              <div
                ref={labelRef}
                className="label-to-print"
                style={{
                  width: '480px',
                  height: '300px',
                  border: '3px solid #000',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  display: 'flex',
                }}
              >
                {/* Columna Izquierda - Empresa */}
                <div
                  className="label-left"
                  style={{
                    width: '30%',
                    borderRight: '3px solid #000',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {/* Nombre Empresa */}
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      lineHeight: '1.3',
                      letterSpacing: '0.3px',
                    }}
                  >
                    EVOLUTION
                    <br />
                    CHEMICAL S.R.L
                  </div>
                </div>

                {/* Columna Derecha - Formulario */}
                <div
                  className="label-right"
                  style={{
                    width: '70%',
                    padding: '12px',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {/* Cliente, Muestra, Fecha */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Cliente:</span>
                      <div
                        style={{
                          borderBottom: '1px solid #000',
                          marginTop: '1px',
                          minHeight: '14px',
                          fontSize: '9px',
                          paddingLeft: '2px',
                        }}
                      >
                        {sample.company_name || ''}
                      </div>
                    </div>
                    <div style={{ width: '80px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Muestra:</span>
                      <div
                        style={{
                          borderBottom: '1px solid #000',
                          marginTop: '1px',
                          minHeight: '14px',
                          fontSize: '9px',
                          paddingLeft: '2px',
                        }}
                      >
                        {sample.sample_type}
                      </div>
                    </div>
                    <div style={{ width: '70px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Fecha:</span>
                      <div
                        style={{
                          borderBottom: '1px solid #000',
                          marginTop: '1px',
                          minHeight: '14px',
                          fontSize: '8px',
                          paddingLeft: '2px',
                        }}
                      >
                        {new Date(sample.sample_date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Contacto:</span>
                    <div
                      style={{
                        borderBottom: '1px solid #000',
                        marginTop: '1px',
                        minHeight: '14px',
                        fontSize: '9px',
                        paddingLeft: '2px',
                      }}
                    >
                      {sample.contact_email}
                    </div>
                  </div>

                  {/* Análisis */}
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Análisis:</span>
                    <div
                      style={{
                        borderBottom: '1px solid #000',
                        marginTop: '1px',
                        minHeight: '14px',
                        fontSize: '9px',
                        paddingLeft: '2px',
                        lineHeight: '1.3',
                      }}
                    >
                      {sample.requested_analysis}
                    </div>
                  </div>

                  {/* Código de Muestra - en línea */}
                  <div
                    style={{
                      paddingTop: '6px',
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Código de Muestra:</span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        borderBottom: '1px solid #000',
                        paddingLeft: '2px',
                        minWidth: '80px',
                      }}
                    >
                      {sample.internal_code}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dimensión de referencia */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Etiqueta para pegar en frascos/botellas de muestra (8cm × 5cm)
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  console.log('Botón imprimir clickeado');
                  handlePrint();
                }}
                className="flex items-center gap-2 bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Imprimir Etiqueta
              </button>
              <button
                onClick={onClose}
                className="border border-gray-900 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
