/**
 * Página de análisis cromatográfico
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  uploadXLSXFile,
  calculateProperties,
  generateReport
} from '@/src/modules/chromatography/services/chromatographyService';
import { UploadXLSXResponse } from '@/src/modules/chromatography/types';

type ProcessStep = 'idle' | 'uploading' | 'calculating' | 'generating-report' | 'complete';

interface ExcelPreviewData {
  headers: string[];
  rows: any[][];
}

export default function ChromatographyPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [currentStep, setCurrentStep] = useState<ProcessStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [excelPreview, setExcelPreview] = useState<ExcelPreviewData | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);

      // Leer y parsear el Excel para preview
      await parseExcelForPreview(selectedFile);
    }
  };

  const parseExcelForPreview = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Leer la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length > 0) {
        // Primeras 10 filas para preview
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1, 11); // Mostrar máximo 10 filas

        setExcelPreview({ headers, rows });
      }
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setExcelPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo XLSX');
      return;
    }

    if (!companyName) {
      setError('Por favor ingrese el nombre de la empresa');
      return;
    }

    setError(null);

    try {
      // Paso 1: Obtener porcentajes molares (subir Excel)
      setCurrentStep('uploading');
      const uploadResult = await uploadXLSXFile(file, {
        company_name: companyName,
        field_name: fieldName,
      });

      // Paso 2: Generar análisis (calcular propiedades)
      setCurrentStep('calculating');
      await calculateProperties(uploadResult.analysis_id, {
        apply_o2_n2_discount: false,
        discount_percentage: 0,
        include_viscosities: false,
      });

      // Paso 3: Generar informe HTML
      setCurrentStep('generating-report');
      await generateReport(uploadResult.analysis_id);

      // Proceso completado
      setCurrentStep('complete');

      // Pequeña pausa para que el usuario vea el mensaje de completado
      setTimeout(() => {
        router.push(`/cromatografia/${uploadResult.analysis_id}`);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Error procesando análisis');
      setCurrentStep('idle');
    }
  };

  const getStepMessage = () => {
    switch (currentStep) {
      case 'uploading':
        return 'Obteniendo porcentajes molares...';
      case 'calculating':
        return 'Generando análisis...';
      case 'generating-report':
        return 'Generando informe...';
      case 'complete':
        return '¡Proceso completado! Redirigiendo...';
      default:
        return '';
    }
  };

  const isProcessing = currentStep !== 'idle';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Análisis Cromatográfico</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Subir archivo del cromatógrafo</h2>

          <div className="space-y-4">
            {/* Campo de empresa */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Empresa *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la empresa cliente"
                required
              />
            </div>

            {/* Campo de yacimiento */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Yacimiento (opcional)
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del yacimiento"
              />
            </div>

            {/* Selector de archivo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Archivo XLSX del cromatógrafo *
              </label>

              {!file ? (
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5 transition-colors hover:border-blue-400">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none hover:text-blue-500"
                      >
                        <span>Seleccionar archivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">o arrastrar y soltar</p>
                    </div>
                    <p className="text-xs text-gray-500">XLSX o XLS hasta 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-gray-300 bg-white">
                  {/* Header con nombre del archivo */}
                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-gray-900">{file.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setExcelPreview(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  {/* Preview de datos */}
                  {excelPreview && (
                    <div className="p-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">Preview del archivo:</p>
                      <div className="max-h-96 overflow-auto rounded border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {excelPreview.headers.map((header, idx) => (
                                <th
                                  key={idx}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {excelPreview.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-gray-50">
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="px-3 py-2 whitespace-nowrap text-gray-900">
                                    {cell !== undefined && cell !== null ? String(cell) : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {excelPreview.rows.length >= 10 && (
                        <p className="mt-2 text-xs text-gray-500">Mostrando las primeras 10 filas...</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Progress message */}
            {isProcessing && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="text-sm font-medium text-blue-800">{getStepMessage()}</p>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${currentStep === 'uploading' || currentStep === 'calculating' || currentStep === 'generating-report' || currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={currentStep === 'uploading' || currentStep === 'calculating' || currentStep === 'generating-report' || currentStep === 'complete' ? 'text-green-700 font-medium' : 'text-gray-500'}>
                      Porcentajes molares
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${currentStep === 'calculating' || currentStep === 'generating-report' || currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={currentStep === 'calculating' || currentStep === 'generating-report' || currentStep === 'complete' ? 'text-green-700 font-medium' : 'text-gray-500'}>
                      Análisis de propiedades
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${currentStep === 'generating-report' || currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={currentStep === 'generating-report' || currentStep === 'complete' ? 'text-green-700 font-medium' : 'text-gray-500'}>
                      Informe HTML
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de subida */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                disabled={isProcessing}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={isProcessing || !file || !companyName}
                className={`rounded-md px-6 py-2 text-white transition-colors ${
                  isProcessing || !file || !companyName
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Procesando...' : 'Subir y analizar'}
              </button>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-blue-900">Proceso Automatizado</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
            <li>Suba el archivo XLSX exportado por el cromatógrafo Agilent</li>
            <li>El sistema procesará automáticamente:
              <ul className="ml-6 mt-1 list-inside list-circle space-y-1">
                <li>Extracción de porcentajes molares</li>
                <li>Cálculo de propiedades del gas</li>
                <li>Generación del informe HTML</li>
              </ul>
            </li>
            <li>Una vez completado, podrá ver el análisis detallado y el informe final</li>
            <li>El informe es editable antes de imprimir o exportar a PDF</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
