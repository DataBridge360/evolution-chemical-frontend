'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  FileSpreadsheet,
  HelpCircle,
  Search,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';
import { Company } from '@/src/types/company';

interface FileUpload01Props {
  companies: Company[];
  companySearch: string;
  fieldName: string;
  file: File | null;
  disabled?: boolean;
  error?: string | null;
  loadingCompanies?: boolean;
  selectedCompanyId: string;
  onClear: () => void;
  onCompanySearchChange: (value: string) => void;
  onCompanySelect: (company: Company) => void;
  onFieldNameChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  onSubmit: () => void;
}

const ACCEPTED_FILE_TYPES =
  '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

export default function FileUpload01({
  companies,
  companySearch,
  fieldName,
  file,
  disabled = false,
  error,
  loadingCompanies = false,
  selectedCompanyId,
  onClear,
  onCompanySearchChange,
  onCompanySelect,
  onFieldNameChange,
  onFileSelect,
  onSubmit,
}: FileUpload01Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const [fileProgress, setFileProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = companySearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return companies.slice(0, 8);
    }

    return companies
      .filter((company) => company.name.toLowerCase().includes(normalizedSearch))
      .slice(0, 8);
  }, [companies, companySearch]);

  useEffect(() => {
    if (!file) {
      setFileProgress(0);
      return;
    }

    setFileProgress(18);

    const interval = window.setInterval(() => {
      setFileProgress((progress) => {
        if (progress >= 100) {
          window.clearInterval(interval);
          return 100;
        }

        return Math.min(progress + 16, 100);
      });
    }, 110);

    return () => window.clearInterval(interval);
  }, [file]);

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];

    if (!selectedFile || disabled) return;

    setIsDragging(false);
    onFileSelect(selectedFile);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearSelection = () => {
    if (disabled) return;

    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onClear();
  };

  const handleBoxClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileSelect(event.dataTransfer.files);
  };

  const handleCompanyInputFocus = () => {
    if (!disabled) {
      setIsCompanyMenuOpen(true);
    }
  };

  const handleCompanyInputBlur = () => {
    window.setTimeout(() => {
      setIsCompanyMenuOpen(false);
    }, 100);
  };

  const handleCompanySelect = (company: Company) => {
    onCompanySelect(company);
    setIsCompanyMenuOpen(false);
    companyInputRef.current?.blur();
  };

  const canSubmit = Boolean(file && selectedCompanyId) && !disabled;

  return (
    <Card className="w-full rounded-3xl border border-[#d8e4f2] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardContent className="p-0">
        <div className="border-b border-[#e6eef7] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#10243e]">
                Carga cromatográfica
              </h1>
              <p className="text-sm leading-6 text-[#56667a]">
                Subí el Excel del cromatógrafo, asociá la empresa y procesá el análisis.
              </p>
            </div>

            <div className="rounded-full border border-[#d5e6f8] bg-[#f5f9ff] px-3 py-1 text-xs font-semibold text-[#0b63a8]">
              XLSX / XLS
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fieldName" className="text-sm font-medium text-[#21364d]">
                Yacimiento <span className="text-[#7b8da1]">(opcional)</span>
              </Label>
              <Input
                id="fieldName"
                value={fieldName}
                disabled={disabled}
                onChange={(event) => onFieldNameChange(event.target.value)}
                placeholder="Nombre del yacimiento"
                className="h-11 rounded-xl border-[#d6e1ee] bg-white px-4 text-[#10243e] shadow-none placeholder:text-[#8ca0b3] focus-visible:border-[#0b63a8] focus-visible:ring-4 focus-visible:ring-[#d9ebfb]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySearch" className="text-sm font-medium text-[#21364d]">
                Empresa <span className="text-[#0b63a8]">*</span>
              </Label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7c90a5]">
                  <Search className="h-4 w-4" />
                </div>

                <Input
                  ref={companyInputRef}
                  id="companySearch"
                  value={companySearch}
                  disabled={disabled || loadingCompanies}
                  onFocus={handleCompanyInputFocus}
                  onBlur={handleCompanyInputBlur}
                  onChange={(event) => {
                    onCompanySearchChange(event.target.value);
                    setIsCompanyMenuOpen(true);
                  }}
                  placeholder={loadingCompanies ? 'Cargando empresas...' : 'Buscar empresa'}
                  className="h-11 rounded-xl border-[#d6e1ee] bg-white pl-11 pr-11 text-[#10243e] shadow-none placeholder:text-[#8ca0b3] focus-visible:border-[#0b63a8] focus-visible:ring-4 focus-visible:ring-[#d9ebfb]"
                  autoComplete="off"
                />

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#7c90a5]">
                  <ChevronDown className="h-4 w-4" />
                </div>

                {isCompanyMenuOpen && !disabled && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#d6e1ee] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                    <div className="max-h-64 overflow-y-auto py-2">
                      {loadingCompanies ? (
                        <div className="px-4 py-3 text-sm text-[#5c7086]">Cargando empresas...</div>
                      ) : filteredCompanies.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-[#5c7086]">
                          No se encontraron empresas.
                        </div>
                      ) : (
                        filteredCompanies.map((company) => {
                          const isSelected = company.company_id === selectedCompanyId;

                          return (
                            <button
                              key={company.company_id}
                              type="button"
                              className={cn(
                                'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors',
                                isSelected
                                  ? 'bg-[#eef6ff] text-[#0b63a8]'
                                  : 'text-[#21364d] hover:bg-[#f7fafe]',
                              )}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleCompanySelect(company);
                              }}
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span
                                  className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                    isSelected
                                      ? 'bg-[#d9ebfb] text-[#0b63a8]'
                                      : 'bg-[#eef3f8] text-[#6d8197]',
                                  )}
                                >
                                  <Building2 className="h-4 w-4" />
                                </span>
                                <span className="truncate">{company.name}</span>
                              </span>

                              {isSelected && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            className={cn(
              'relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#bcd4ec] bg-[#f8fbff] px-6 py-10 text-center transition-colors',
              'hover:border-[#8eb8e2] hover:bg-[#f5f9ff]',
              isDragging && 'border-[#0b63a8] bg-[#eef6ff]',
              disabled && 'cursor-not-allowed opacity-60',
              error && 'border-red-300 bg-red-50',
            )}
            onClick={handleBoxClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
                event.preventDefault();
                handleBoxClick();
              }
            }}
          >
            {file ? (
              <>
                <button
                  type="button"
                  aria-label="Quitar archivo"
                  disabled={disabled}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5e6f8] bg-white text-[#53708f] shadow-sm transition-colors hover:border-[#b8d4f0] hover:bg-[#f5f9ff] hover:text-[#0b63a8] disabled:pointer-events-none"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClearSelection();
                  }}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="w-full max-w-2xl space-y-5 text-left">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0b63a8] shadow-[0_10px_24px_rgba(11,99,168,0.08)]">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[#10243e]">
                            {file.name}
                          </p>
                          <p className="text-sm text-[#5c7086]">
                            {Math.round(file.size / 1024)} KB
                          </p>
                        </div>

                        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-semibold text-[#0b63a8]">
                          <span className="h-2 w-2 rounded-full bg-[#0b63a8]" />
                          Archivo listo
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-[#5c7086]">
                          <span>Preparado para procesar</span>
                          <span>{Math.round(fileProgress)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#dbe8f5]">
                          <div
                            className="h-full rounded-full bg-[#0b63a8] transition-[width] duration-150"
                            style={{ width: `${fileProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#5c7086]">
                    <span>Hacé clic o arrastrá otro archivo para reemplazarlo.</span>
                    <span className="rounded-full border border-[#d5e6f8] bg-white px-3 py-1 text-xs font-medium text-[#21466b]">
                      .xlsx / .xls
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 rounded-2xl bg-white p-4 shadow-[0_10px_24px_rgba(11,99,168,0.08)]">
                  <Upload className="h-6 w-6 text-[#0b63a8]" />
                </div>

                <div className="space-y-2">
                  <p className="text-base font-medium text-[#10243e]">
                    Arrastrá el archivo o hacé clic para cargarlo
                  </p>
                  <p className="text-sm leading-6 text-[#5c7086]">
                    Se aceptan archivos Excel del cromatógrafo en formato{' '}
                    <span className="font-medium text-[#21466b]">.xlsx</span> y{' '}
                    <span className="font-medium text-[#21466b]">.xls</span>.
                  </p>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              id="fileUpload"
              type="file"
              className="hidden"
              accept={ACCEPTED_FILE_TYPES}
              disabled={disabled}
              onChange={(event) => handleFileSelect(event.target.files)}
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e6eef7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm text-[#5c7086] transition-colors hover:text-[#21466b]"
                >
                  <HelpCircle className="h-4 w-4" />
                  Formatos admitidos y tamaño máximo
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px] border border-[#d6e1ee] bg-white py-3 text-[#10243e] shadow-lg">
                <p className="text-xs leading-5 text-[#5c7086]">
                  Solo se aceptan archivos Excel del cromatógrafo en formato XLSX o XLS. Tamaño
                  máximo: 10MB.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex gap-3 self-end">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={handleClearSelection}
              className="h-11 rounded-xl border-[#d6e1ee] bg-white px-5 text-sm font-medium text-[#33485f] hover:bg-[#f7fafe]"
            >
              Limpiar
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className="h-11 rounded-xl bg-[#0b63a8] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(11,99,168,0.22)] hover:bg-[#09568f] disabled:bg-[#b7c4d2] disabled:shadow-none"
            >
              Procesar análisis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
