'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';

import { cn } from '@/src/lib/utils';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import type { Company } from '@/src/types/company';
import { useUploadHistoric } from '../hooks/useHistoricFQTypeA';
import type { Oilfield } from '../types';

interface UploadHistoricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCEPTED_FILE_TYPES = '.xlsx,.xls';

export function UploadHistoricModal({ isOpen, onClose }: UploadHistoricModalProps) {
  const router = useRouter();
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const uploadMutation = useUploadHistoric();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [oilfield, setOilfield] = useState<Oilfield>('SCH');
  const [plant, setPlant] = useState('');
  const [equipment, setEquipment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCompany(null);
      setCompanySearch('');
      setOilfield('SCH');
      setPlant('');
      setEquipment('');
      setFile(null);
      setUploadError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const filteredCompanies = useMemo(() => {
    const search = companySearch.trim().toLowerCase();
    if (!search) return companies.slice(0, 8);
    return companies.filter((c) => c.name.toLowerCase().includes(search)).slice(0, 8);
  }, [companies, companySearch]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleFileSelect = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    const ext = selected.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.pdf')) {
      setUploadError('El archivo debe ser formato XLSX, XLS o PDF');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setUploadError('El archivo no puede superar los 10 MB');
      return;
    }

    setUploadError(null);
    setFile(selected);
  };

  const canSubmit = selectedCompany && plant.trim() && equipment.trim() && file;

  const handleUpload = async () => {
    if (!file || !selectedCompany) return;
    setUploadError(null);

    try {
      await uploadMutation.mutateAsync({
        file,
        metadata: {
          company_id: selectedCompany.company_id,
          oilfield,
          localidad: selectedCompany.localidad,
          plant,
          equipment,
        },
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error subiendo archivo';
      setUploadError(message);
    }
  };

  const handleViewHistoric = () => {
    if (!selectedCompany) return;
    onClose();
    router.push(
      `/analisis/${selectedCompany.localidad}/${selectedCompany.company_id}/historico/fq-tipo-a`,
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] bg-black/30"
      onClick={handleOverlayClick}
    >
      {/* Panel slide-in from right */}
      <div className="animate-in slide-in-from-right absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[#e5e5e5] bg-white shadow-xl shadow-black/5 duration-200">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#f0f0f0] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#0a0a0a]">Agregar Historico</h2>
            <p className="mt-0.5 text-xs text-[#a3a3a3]">
              {success ? 'Registro agregado correctamente' : 'Completa los datos y subi el archivo'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {success ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#0a0a0a]">
                Se agrego a tu historico
              </h3>
              <p className="mt-2 text-sm text-[#737373]">
                El informe fue procesado y los datos se agregaron al historico FQ Tipo A de{' '}
                <span className="font-medium text-[#0a0a0a]">{selectedCompany?.name}</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Historic Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525252]">Tipo de Historico</label>
                <div className="flex h-9 items-center rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm text-[#0a0a0a]">
                  FQ Tipo A - Fisicoquimico de Agua
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525252]">
                  Empresa <span className="text-[#006096]">*</span>
                </label>
                <div className="relative">
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
                    className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-white pl-3 pr-8 text-sm text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:border-[#006096] focus:outline-none focus:ring-1 focus:ring-[#006096]/20"
                    autoComplete="off"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#a3a3a3]">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>

                  {isCompanyMenuOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white shadow-lg shadow-black/5">
                      <div className="max-h-48 overflow-y-auto py-1">
                        {loadingCompanies ? (
                          <div className="px-3 py-2 text-xs text-[#a3a3a3]">Cargando...</div>
                        ) : filteredCompanies.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-[#a3a3a3]">
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
                                    ? 'bg-[#f5f5f5] font-medium text-[#006096]'
                                    : 'text-[#525252] hover:bg-[#fafafa]',
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
                                        ? 'bg-[#006096]/10 text-[#006096]'
                                        : 'bg-[#f5f5f5] text-[#a3a3a3]',
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
                <label className="text-xs font-medium text-[#525252]">
                  Yacimiento <span className="text-[#006096]">*</span>
                </label>
                <div className="flex gap-2">
                  {(['SCH', 'EMA'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOilfield(value)}
                      className={cn(
                        'flex-1 rounded-lg border py-2 text-sm font-medium transition-all',
                        oilfield === value
                          ? 'border-[#006096] bg-[#006096]/5 text-[#006096]'
                          : 'border-[#e5e5e5] bg-white text-[#737373] hover:border-[#d4d4d4]',
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plant & Equipment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#525252]">
                    Planta <span className="text-[#006096]">*</span>
                  </label>
                  <input
                    value={plant}
                    onChange={(e) => setPlant(e.target.value.toUpperCase())}
                    placeholder="Ej: PTG01"
                    className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm uppercase text-[#0a0a0a] placeholder:normal-case placeholder:text-[#a3a3a3] focus:border-[#006096] focus:outline-none focus:ring-1 focus:ring-[#006096]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#525252]">
                    Equipo <span className="text-[#006096]">*</span>
                  </label>
                  <input
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value.toUpperCase())}
                    placeholder="Ej: TK5030"
                    className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm uppercase text-[#0a0a0a] placeholder:normal-case placeholder:text-[#a3a3a3] focus:border-[#006096] focus:outline-none focus:ring-1 focus:ring-[#006096]/20"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#f0f0f0]" />

              {/* File upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525252]">
                  Archivo <span className="text-[#006096]">*</span>
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors',
                    file
                      ? 'border-[#e5e5e5] bg-white'
                      : 'border-[#d4d4d4] bg-[#fafafa] hover:border-[#a3a3a3] hover:bg-[#f5f5f5]',
                    isDragging && 'border-[#006096] bg-[#006096]/5',
                    uploadError && 'border-red-300 bg-red-50/50',
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
                    <div className="flex w-full items-center gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#006096]">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium text-[#0a0a0a]">{file.name}</p>
                        <p className="text-xs text-[#a3a3a3]">{Math.round(file.size / 1024)} KB</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setUploadError(null);
                          }}
                          className="mt-1 text-xs text-[#006096] hover:underline"
                        >
                          Cambiar archivo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f5]">
                        <Upload className="h-4 w-4 text-[#a3a3a3]" />
                      </div>
                      <p className="text-sm font-medium text-[#525252]">
                        Arrastra o hace clic para cargar
                      </p>
                      <p className="mt-0.5 text-xs text-[#a3a3a3]">
                        Formato <span className="font-medium text-[#525252]">.xlsx</span> — max 10
                        MB
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
              </div>

              {uploadError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {uploadError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#f0f0f0] px-6 py-4">
          {success ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-[#e5e5e5] bg-white py-2 text-xs font-medium text-[#525252] transition-colors hover:bg-[#fafafa]"
              >
                Cerrar
              </button>
              <button
                onClick={handleViewHistoric}
                className="flex-1 rounded-lg bg-[#006096] py-2 text-xs font-medium text-white transition-colors hover:bg-[#004d7a]"
              >
                Ver historico
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                disabled={uploadMutation.isPending}
                className="flex-1 rounded-lg border border-[#e5e5e5] bg-white py-2 text-xs font-medium text-[#525252] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={!canSubmit || uploadMutation.isPending}
                onClick={handleUpload}
                className="flex-1 rounded-lg bg-[#006096] py-2 text-xs font-medium text-white transition-colors hover:bg-[#004d7a] disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
              >
                {uploadMutation.isPending ? 'Procesando...' : 'Subir y procesar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
