/**
 * Página de análisis cromatográfico
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadXLSXFile } from '@/src/modules/chromatography/services/chromatographyService';
import { UploadXLSXResponse } from '@/src/modules/chromatography/types';

export default function ChromatographyPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
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

    setUploading(true);
    setError(null);

    try {
      const result = await uploadXLSXFile(file, {
        company_name: companyName,
        field_name: fieldName,
      });

      // Redirigir a la página de edición/cálculo
      router.push(`/cromatografia/${result.analysis_id}`);
    } catch (err: any) {
      setError(err.message || 'Error subiendo archivo');
    } finally {
      setUploading(false);
    }
  };

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
                  {file && (
                    <p className="mt-2 text-sm font-medium text-green-600">
                      Archivo seleccionado: {file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botón de subida */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !file || !companyName}
                className={`rounded-md px-6 py-2 text-white transition-colors ${
                  uploading || !file || !companyName
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploading ? 'Subiendo...' : 'Subir y analizar'}
              </button>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-blue-900">Instrucciones</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
            <li>Suba el archivo XLSX exportado por el cromatógrafo Agilent</li>
            <li>El sistema extraerá automáticamente los % molares de cada compuesto</li>
            <li>Podrá revisar y ajustar los datos antes de calcular las propiedades</li>
            <li>Una vez calculado, podrá generar el informe final en formato Excel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
