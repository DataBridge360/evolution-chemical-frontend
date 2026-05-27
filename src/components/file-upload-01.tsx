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
    <Card className="w-full rounded-2xl border border-[#d8e4f2] bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-[#e6eef7] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-[#10243e]">
                Carga cromatográfica
              </h1>
              <p className="text-xs leading-5 text-[#56667a]">
                Subí el Excel del cromatógrafo, asociá la empresa y procesá el análisis.
              </p>
            </div>

            <div className="rounded-full border border-[#d5e6f8] bg-[#f5f9ff] px-2.5 py-0.5 text-[10px] font-semibold text-[#0b63a8]">
              XLSX / XLS
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fieldName" className="text-xs font-medium text-[#21364d]">
                Yacimiento <span className="text-[#7b8da1]">(opcional)</span>
              </Label>
              <Input
                id="fieldName"
                value={fieldName}
                disabled={disabled}
                onChange={(event) => onFieldNameChange(event.target.value)}
                placeholder="Nombre del yacimiento"
                className="h-9 rounded-lg border-[#d6e1ee] bg-white px-3 text-sm text-[#10243e] shadow-none placeholder:text-[#8ca0b3] focus-visible:border-[#0b63a8] focus-visible:ring-2 focus-visible:ring-[#d9ebfb]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="companySearch" className="text-xs font-medium text-[#21364d]">
                Empresa <span className="text-[#0b63a8]">*</span>
              </Label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#7c90a5]">
                  <Search className="h-3.5 w-3.5" />
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
                  className="h-9 rounded-lg border-[#d6e1ee] bg-white pl-9 pr-9 text-sm text-[#10243e] shadow-none placeholder:text-[#8ca0b3] focus-visible:border-[#0b63a8] focus-visible:ring-2 focus-visible:ring-[#d9ebfb]"
                  autoComplete="off"
                />

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#7c90a5]">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>

                {isCompanyMenuOpen && !disabled && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-[#d6e1ee] bg-white shadow-lg">
                    <div className="max-h-52 overflow-y-auto py-1">
                      {loadingCompanies ? (
                        <div className="px-3 py-2 text-xs text-[#5c7086]">Cargando empresas...</div>
                      ) : filteredCompanies.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-[#5c7086]">
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
                                'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors',
                                isSelected
                                  ? 'bg-[#eef6ff] text-[#0b63a8]'
                                  : 'text-[#21364d] hover:bg-[#f7fafe]',
                              )}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleCompanySelect(company);
                              }}
                            >
                              <span className="flex min-w-0 items-center gap-2">
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
          </div>

          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            className={cn(
              'relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bcd4ec] bg-[#f8fbff] px-4 py-6 text-center transition-colors',
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
                  className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d5e6f8] bg-white text-[#53708f] shadow-sm transition-colors hover:border-[#b8d4f0] hover:bg-[#f5f9ff] hover:text-[#0b63a8] disabled:pointer-events-none"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClearSelection();
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="w-full max-w-2xl space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b63a8] shadow-sm">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#10243e]">
                            {file.name}
                          </p>
                          <p className="text-xs text-[#5c7086]">
                            {Math.round(file.size / 1024)} KB
                          </p>
                        </div>

                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e8f3ff] px-2.5 py-0.5 text-[10px] font-semibold text-[#0b63a8]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0b63a8]" />
                          Archivo listo
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-medium text-[#5c7086]">
                          <span>Preparado para procesar</span>
                          <span>{Math.round(fileProgress)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#dbe8f5]">
                          <div
                            className="h-full rounded-full bg-[#0b63a8] transition-[width] duration-150"
                            style={{ width: `${fileProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5c7086]">
                    <span>Hacé clic o arrastrá otro archivo para reemplazarlo.</span>
                    <span className="rounded-full border border-[#d5e6f8] bg-white px-2 py-0.5 text-[10px] font-medium text-[#21466b]">
                      .xlsx / .xls
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
                  <Upload className="h-5 w-5 text-[#0b63a8]" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#10243e]">
                    Arrastrá el archivo o hacé clic para cargarlo
                  </p>
                  <p className="text-xs leading-5 text-[#5c7086]">
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-[#e6eef7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs text-[#5c7086] transition-colors hover:text-[#21466b]"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Formatos admitidos y tamaño máximo
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px] border border-[#d6e1ee] bg-white py-2.5 text-[#10243e] shadow-lg">
                <p className="text-[10px] leading-4 text-[#5c7086]">
                  Solo se aceptan archivos Excel del cromatógrafo en formato XLSX o XLS. Tamaño
                  máximo: 10MB.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex gap-2 self-end">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={handleClearSelection}
              className="h-9 rounded-lg border-[#d6e1ee] bg-white px-4 text-xs font-medium text-[#33485f] hover:bg-[#f7fafe]"
            >
              Limpiar
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className="h-9 rounded-lg bg-[#0b63a8] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#09568f] disabled:bg-[#b7c4d2] disabled:shadow-none"
            >
              Procesar análisis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
