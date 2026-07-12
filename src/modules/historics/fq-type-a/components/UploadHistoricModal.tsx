'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Search,
  Upload,
  X,
} from 'lucide-react';

import { cn } from '@/src/lib/utils';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import type { Company } from '@/src/types/company';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';
import { useUploadHistoric } from '../hooks/useHistoricFQTypeA';
import type { Oilfield } from '../types';

interface UploadHistoricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'config' | 'upload' | 'success';

const ACCEPTED_FILE_TYPES = '.xlsx,.xls';

export function UploadHistoricModal({ isOpen, onClose }: UploadHistoricModalProps) {
  const router = useRouter();
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const uploadMutation = useUploadHistoric();

  const [step, setStep] = useState<Step>('config');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [oilfield, setOilfield] = useState<Oilfield>('SCH');
  const [localidad, setLocalidad] = useState<Localidad>(Localidad.CUTRAL_CO);
  const [plant, setPlant] = useState('');
  const [equipment, setEquipment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setSelectedCompany(null);
      setCompanySearch('');
      setOilfield('SCH');
      setLocalidad(Localidad.CUTRAL_CO);
      setPlant('');
      setEquipment('');
      setFile(null);
      setUploadError(null);
    }
  }, [isOpen]);

  const filteredCompanies = useMemo(() => {
    const search = companySearch.trim().toLowerCase();
    if (!search) return companies.slice(0, 8);
    return companies.filter((c) => c.name.toLowerCase().includes(search)).slice(0, 8);
  }, [companies, companySearch]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    const ext = selected.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.pdf')) {
      setUploadError('The file must be XLSX, XLS, or PDF format');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setUploadError('The file cannot exceed 10 MB');
      return;
    }

    setUploadError(null);
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file || !selectedCompany) return;

    setUploadError(null);

    try {
      await uploadMutation.mutateAsync({
        file,
        metadata: {
          company_id: selectedCompany.company_id,
          oilfield,
          localidad,
          plant,
          equipment,
        },
      });
      setStep('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error uploading file';
      setUploadError(message);
    }
  };

  const handleViewHistoric = () => {
    if (!selectedCompany) return;
    onClose();
    router.push(`/analisis/${localidad}/${selectedCompany.company_id}/historico/fq-tipo-a`);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[#dce8f3] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6eef7] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#10243e]">Agregar Historico</h2>
            <p className="mt-0.5 text-xs text-[#56667a]">
              {step === 'config' && 'Selecciona el tipo y la configuracion'}
              {step === 'upload' && 'Subi el informe para procesar'}
              {step === 'success' && 'Registro agregado correctamente'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#56667a] transition-colors hover:bg-[#f0f4f8] hover:text-[#10243e]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {step === 'config' && (
            <div className="space-y-4">
              {/* Historic Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#21364d]">Tipo de Historico</label>
                <div className="flex h-9 items-center rounded-lg border border-[#d6e1ee] bg-[#f8fbff] px-3 text-sm text-[#10243e]">
                  FQ Tipo A - Fisicoquimico de Agua
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#21364d]">
                  Empresa <span className="text-[#0b63a8]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#7c90a5]">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    ref={companyInputRef}
                    value={companySearch}
                    onFocus={() => setIsCompanyMenuOpen(true)}
                    onBlur={() => setTimeout(() => setIsCompanyMenuOpen(false), 150)}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setIsCompanyMenuOpen(true);
                    }}
                    placeholder={loadingCompanies ? 'Cargando empresas...' : 'Buscar empresa'}
                    className="h-9 w-full rounded-lg border border-[#d6e1ee] bg-white pl-9 pr-9 text-sm text-[#10243e] placeholder:text-[#8ca0b3] focus:border-[#0b63a8] focus:outline-none focus:ring-2 focus:ring-[#d9ebfb]"
                    autoComplete="off"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#7c90a5]">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>

                  {isCompanyMenuOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-xl border border-[#d6e1ee] bg-white shadow-lg">
                      <div className="max-h-48 overflow-y-auto py-1">
                        {loadingCompanies ? (
                          <div className="px-3 py-2 text-xs text-[#5c7086]">Cargando...</div>
                        ) : filteredCompanies.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-[#5c7086]">
                            No se encontraron empresas.
                          </div>
                        ) : (
                          filteredCompanies.map((company) => {
                            const isSelected = company.company_id === selectedCompany?.company_id;
                            return (
                              <button
                                key={company.company_id}
                                type="button"
                                className={cn(
                                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors',
                                  isSelected
                                    ? 'bg-[#eef6ff] text-[#0b63a8]'
                                    : 'text-[#21364d] hover:bg-[#f7fafe]',
                                )}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSelectedCompany(company);
                                  setCompanySearch(company.name);
                                  setIsCompanyMenuOpen(false);
                                  companyInputRef.current?.blur();
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                      isSelected
                                        ? 'bg-[#d9ebfb] text-[#0b63a8]'
                                        : 'bg-[#eef3f8] text-[#6d8197]',
                                    )}
                                  >
                                    <Building2 className="h-3 w-3" />
                                  </span>
                                  <span className="truncate">{company.name}</span>
                                </span>
                                {isSelected && <Check className="h-3 w-3 shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Oilfield */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#21364d]">
                  Yacimiento <span className="text-[#0b63a8]">*</span>
                </label>
                <div className="flex gap-3">
                  {(['SCH', 'EMA'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOilfield(value)}
                      className={cn(
                        'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                        oilfield === value
                          ? 'border-[#0b63a8] bg-[#eef6ff] text-[#0b63a8]'
                          : 'border-[#d6e1ee] bg-white text-[#56667a] hover:border-[#b3c7db]',
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Localidad */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#21364d]">
                  Localidad <span className="text-[#0b63a8]">*</span>
                </label>
                <div className="flex gap-3">
                  {[Localidad.CUTRAL_CO, Localidad.RINCON].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLocalidad(value)}
                      className={cn(
                        'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                        localidad === value
                          ? 'border-[#0b63a8] bg-[#eef6ff] text-[#0b63a8]'
                          : 'border-[#d6e1ee] bg-white text-[#56667a] hover:border-[#b3c7db]',
                      )}
                    >
                      {LOCALIDAD_LABELS[value]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plant */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#21364d]">
                  Planta <span className="text-[#0b63a8]">*</span>
                </label>
                <input
                  value={plant}
                  onChange={(e) => setPlant(e.target.value.toUpperCase())}
                  placeholder="Ej: PTG01"
                  className="h-9 w-full rounded-lg border border-[#d6e1ee] bg-white px-3 text-sm uppercase text-[#10243e] placeholder:normal-case placeholder:text-[#8ca0b3] focus:border-[#0b63a8] focus:outline-none focus:ring-2 focus:ring-[#d9ebfb]"
                />
              </div>

              {/* Equipment */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#21364d]">
                  Equipo <span className="text-[#0b63a8]">*</span>
                </label>
                <input
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value.toUpperCase())}
                  placeholder="Ej: TK5030"
                  className="h-9 w-full rounded-lg border border-[#d6e1ee] bg-white px-3 text-sm uppercase text-[#10243e] placeholder:normal-case placeholder:text-[#8ca0b3] focus:border-[#0b63a8] focus:outline-none focus:ring-2 focus:ring-[#d9ebfb]"
                />
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-[#d6e1ee] bg-[#f8fbff] px-4 py-2.5">
                <Building2 className="h-4 w-4 text-[#0b63a8]" />
                <div className="text-xs">
                  <span className="font-semibold text-[#10243e]">{selectedCompany?.name}</span>
                  <span className="mx-2 text-[#8ca0b3]">|</span>
                  <span className="text-[#56667a]">{oilfield}</span>
                  <span className="mx-2 text-[#8ca0b3]">|</span>
                  <span className="text-[#56667a]">{LOCALIDAD_LABELS[localidad]}</span>
                  <span className="mx-2 text-[#8ca0b3]">|</span>
                  <span className="text-[#56667a]">{plant}</span>
                  <span className="mx-2 text-[#8ca0b3]">|</span>
                  <span className="text-[#56667a]">{equipment}</span>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                className={cn(
                  'relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bcd4ec] bg-[#f8fbff] px-4 py-6 text-center transition-colors',
                  'hover:border-[#8eb8e2] hover:bg-[#f5f9ff]',
                  isDragging && 'border-[#0b63a8] bg-[#eef6ff]',
                  uploadError && 'border-red-300 bg-red-50',
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                {file ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b63a8] shadow-sm">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-semibold text-[#10243e]">{file.name}</p>
                      <p className="text-xs text-[#5c7086]">{Math.round(file.size / 1024)} KB</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setUploadError(null);
                        }}
                        className="mt-1 text-xs text-[#0b63a8] hover:underline"
                      >
                        Cambiar archivo
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
                      <Upload className="h-5 w-5 text-[#0b63a8]" />
                    </div>
                    <p className="text-sm font-medium text-[#10243e]">
                      Arrastra el archivo o hace clic para cargarlo
                    </p>
                    <p className="mt-1 text-xs text-[#5c7086]">
                      Se aceptan archivos en formato{' '}
                      <span className="font-medium text-[#21466b]">.xlsx</span>
                    </p>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {uploadError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f8f0]">
                <CheckCircle2 className="h-8 w-8 text-[#0f8a5f]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#10243e]">
                Se agrego a tu historico
              </h3>
              <p className="mt-2 text-sm text-[#56667a]">
                El informe fue procesado y los datos se agregaron al historico FQ Tipo A de{' '}
                <span className="font-medium text-[#10243e]">{selectedCompany?.name}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#e6eef7] px-6 py-4">
          {step === 'config' && (
            <>
              <button
                onClick={onClose}
                className="h-9 rounded-lg border border-[#d6e1ee] bg-white px-4 text-xs font-medium text-[#33485f] transition-colors hover:bg-[#f7fafe]"
              >
                Cancelar
              </button>
              <button
                disabled={!selectedCompany || !plant.trim() || !equipment.trim()}
                onClick={() => setStep('upload')}
                className="h-9 rounded-lg bg-[#0b63a8] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#09568f] disabled:bg-[#b7c4d2] disabled:shadow-none"
              >
                Continuar
              </button>
            </>
          )}

          {step === 'upload' && (
            <>
              <button
                onClick={() => {
                  setStep('config');
                  setFile(null);
                  setUploadError(null);
                }}
                disabled={uploadMutation.isPending}
                className="h-9 rounded-lg border border-[#d6e1ee] bg-white px-4 text-xs font-medium text-[#33485f] transition-colors hover:bg-[#f7fafe] disabled:opacity-50"
              >
                Volver
              </button>
              <button
                disabled={!file || uploadMutation.isPending}
                onClick={handleUpload}
                className="h-9 rounded-lg bg-[#0b63a8] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#09568f] disabled:bg-[#b7c4d2] disabled:shadow-none"
              >
                {uploadMutation.isPending ? 'Procesando...' : 'Subir y procesar'}
              </button>
            </>
          )}

          {step === 'success' && (
            <>
              <button
                onClick={onClose}
                className="h-9 rounded-lg border border-[#d6e1ee] bg-white px-4 text-xs font-medium text-[#33485f] transition-colors hover:bg-[#f7fafe]"
              >
                Cerrar
              </button>
              <button
                onClick={handleViewHistoric}
                className="h-9 rounded-lg bg-[#0b63a8] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#09568f]"
              >
                Ver historico
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
