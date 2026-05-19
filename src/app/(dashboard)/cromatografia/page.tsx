/**
 * Página de análisis cromatográfico
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  uploadXLSXFile,
  calculateProperties,
  generateReport,
} from '@/src/modules/chromatography/services/chromatographyService';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Company } from '@/src/types/company';
import AnalysisLoadingModal from '@/src/modules/chromatography/components/AnalysisLoadingModal';

type ProcessStep = 'idle' | 'uploading' | 'calculating' | 'generating-report' | 'complete';

interface ExcelPreviewData {
  headers: string[];
  rows: any[][];
}

export default function ChromatographyPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [currentStep, setCurrentStep] = useState<ProcessStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [excelPreview, setExcelPreview] = useState<ExcelPreviewData | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Cargar empresas al montar
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const data = await companiesService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      setError('Error cargando lista de empresas');
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Filtrar empresas por búsqueda
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

    if (!selectedCompanyId) {
      setError('Por favor seleccione una empresa');
      return;
    }

    setError(null);

    try {
      // Paso 1: Obtener porcentajes molares (subir Excel)
      setCurrentStep('uploading');
      const uploadResult = await uploadXLSXFile(file, {
        company_id: selectedCompanyId,
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

  const isProcessing = currentStep !== 'idle';

  return (
    <div className="flex min-h-full items-start pt-16">
      {/* Contenedor Glass */}
      <div className="w-full overflow-hidden rounded-2xl border border-white/20 bg-white/40 shadow-2xl backdrop-blur-xl">
        <div className="p-8">
            {/* Carga de Archivo */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold text-foreground">
                Archivo XLSX <span className="text-destructive">*</span>
              </label>

              {!file ? (
                <div className="group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-white/50 px-6 py-8 backdrop-blur-sm transition-all hover:border-primary hover:bg-white/70">
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleFileChange}
                  />

                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                      <svg
                        className="h-8 w-8 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>

                    <p className="mb-1 text-base">
                      <span className="font-semibold text-primary">Seleccionar archivo</span>
                      <span className="text-muted-foreground"> o arrastrar aquí</span>
                    </p>
                    <p className="text-sm text-muted-foreground">XLSX, XLS • Máx. 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-border/60 bg-primary/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <svg
                          className="h-6 w-6 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setExcelPreview(null);
                      }}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Eliminar
                    </button>
                  </div>

                  {excelPreview && (
                    <div className="p-4">
                      <p className="mb-2 text-sm font-semibold text-foreground">Vista previa</p>
                      <div className="overflow-hidden rounded-lg border border-border/60">
                        <div className="max-h-60 overflow-auto">
                          <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                              <tr>
                                {excelPreview.headers.map((header, idx) => (
                                  <th
                                    key={idx}
                                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-white/50">
                              {excelPreview.rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="transition-colors hover:bg-white/80">
                                  {row.map((cell, cellIdx) => (
                                    <td
                                      key={cellIdx}
                                      className="whitespace-nowrap px-3 py-2 text-foreground"
                                    >
                                      {cell !== undefined && cell !== null ? String(cell) : '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {excelPreview.rows.length >= 10 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Mostrando primeras 10 filas
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Empresa <span className="text-destructive">*</span>
                </label>
                {loadingCompanies ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/60 px-4 py-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Cargando empresas...</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2 w-full rounded-lg border border-border/60 bg-white/60 px-4 py-2.5 text-foreground backdrop-blur-sm placeholder:text-muted-foreground focus:border-primary focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Buscar empresa..."
                    />
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-white/60 px-4 py-2.5 text-foreground backdrop-blur-sm focus:border-primary focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    >
                      <option value="">Seleccionar empresa...</option>
                      {filteredCompanies.map((company) => (
                        <option key={company.company_id} value={company.company_id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {filteredCompanies.length === 0 && searchTerm && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        No se encontraron empresas con "{searchTerm}"
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Yacimiento <span className="text-xs text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-white/60 px-4 py-2.5 text-foreground backdrop-blur-sm placeholder:text-muted-foreground focus:border-primary focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Nombre del yacimiento"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 backdrop-blur-sm">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="border-t border-white/20 bg-white/30 px-8 py-4 backdrop-blur-sm">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                disabled={isProcessing}
                className="rounded-lg border border-border/60 bg-white/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={isProcessing || !file || !selectedCompanyId}
                className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-lg transition-all ${
                  isProcessing || !file || !selectedCompanyId
                    ? 'cursor-not-allowed bg-muted-foreground text-white'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Procesar Análisis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      {/* Modal de carga futurista */}
      <AnalysisLoadingModal
        isOpen={isProcessing}
        currentStep={currentStep === 'idle' ? 'uploading' : currentStep}
      />
    </div>
  );
}
