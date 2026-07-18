'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { IN_SITU_PARAMETERS, CHEMICAL_PARAMETERS, type ReportParameter } from '../constants';
import { type EnvironmentReportFormData } from '../types';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { cn } from '@/src/lib/utils';
import type { Company } from '@/src/types/company';

interface ReportFormProps {
  register: UseFormRegister<EnvironmentReportFormData>;
  errors: FieldErrors<EnvironmentReportFormData>;
  setValue: UseFormSetValue<EnvironmentReportFormData>;
  watch: UseFormWatch<EnvironmentReportFormData>;
  selectedCompany: Company | null;
  onCompanySelect: (company: Company) => void;
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#e5e5e5]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-1 py-3 text-left text-sm font-semibold text-[#0a0a0a]"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-[#737373] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function FieldRow({
  label,
  fieldName,
  register,
  error,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  fieldName: keyof EnvironmentReportFormData;
  register: UseFormRegister<EnvironmentReportFormData>;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2">
      <Label className="text-xs text-[#525252]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <div>
        <Input
          {...register(fieldName)}
          type={type}
          placeholder={placeholder}
          className={cn('h-8 text-xs', error && 'border-red-400')}
        />
        {error && <span className="text-[10px] text-red-500">{error}</span>}
      </div>
    </div>
  );
}

function ParameterFields({
  parameters,
  register,
  setValue,
  watch,
}: {
  parameters: ReportParameter[];
  register: UseFormRegister<EnvironmentReportFormData>;
  setValue: UseFormSetValue<EnvironmentReportFormData>;
  watch: UseFormWatch<EnvironmentReportFormData>;
}) {
  const units = watch('_units') || {};
  const methods = watch('_methods') || {};

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="grid grid-cols-[1fr_58px_50px_90px] items-center gap-1 px-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
          Parámetro
        </span>
        <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
          Unidad
        </span>
        <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
          Valor
        </span>
        <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
          Método
        </span>
      </div>

      {parameters.map((param) => (
        <div
          key={param.fieldName}
          className="grid grid-cols-[1fr_58px_50px_90px] items-center gap-1"
        >
          <Label className="truncate text-xs text-[#525252]" title={param.label}>
            {param.label}
          </Label>
          <input
            value={units[param.fieldName] ?? param.unit}
            onChange={(e) => {
              setValue('_units', {
                ...units,
                [param.fieldName]: e.target.value,
              });
            }}
            className="h-7 w-full border border-input bg-background px-1 text-center text-[10px] text-[#737373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="—"
          />
          <Input
            {...register(param.fieldName as keyof EnvironmentReportFormData)}
            className="h-7 text-center text-xs"
            placeholder="—"
          />
          <input
            value={methods[param.fieldName] ?? param.method}
            onChange={(e) => {
              setValue('_methods', {
                ...methods,
                [param.fieldName]: e.target.value,
              });
            }}
            className="h-7 w-full border border-input bg-background px-1 text-[10px] text-[#737373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="—"
          />
        </div>
      ))}
    </div>
  );
}

export function ReportForm({
  register,
  errors,
  setValue,
  watch,
  selectedCompany,
  onCompanySelect,
}: ReportFormProps) {
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const companyInputRef = useRef<HTMLInputElement>(null);

  const filteredCompanies = useMemo(() => {
    const search = companySearch.trim().toLowerCase();
    if (!search) return companies.slice(0, 8);
    return companies.filter((c) => c.name.toLowerCase().includes(search)).slice(0, 8);
  }, [companies, companySearch]);

  return (
    <div className="space-y-0">
      {/* ── Datos Generales ──────────────────────────────── */}
      <CollapsibleSection title="Datos Generales" defaultOpen>
        <p className="mb-3 text-[11px] text-[#737373]">
          Los campos marcados con <span className="font-medium text-red-500">*</span> son
          obligatorios para generar el historial.
        </p>
        <div className="space-y-2">
          {/* Company selector */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label className="text-xs text-[#525252]">
              Empresa<span className="text-red-500"> *</span>
            </Label>
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
                placeholder={loadingCompanies ? 'Cargando...' : 'Buscar empresa'}
                className="h-8 w-full border border-input bg-background pl-3 pr-8 text-xs placeholder:text-[#a3a3a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="off"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[#a3a3a3]">
                <ChevronDown className="h-3 w-3" />
              </div>

              {isCompanyMenuOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-md border border-[#e5e5e5] bg-white shadow-lg shadow-black/5">
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
                              'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                              isSelected
                                ? 'bg-[#f5f5f5] font-medium text-[#006096]'
                                : 'text-[#525252] hover:bg-[#fafafa]',
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onCompanySelect(company);
                              setCompanySearch(company.name);
                              setIsCompanyMenuOpen(false);
                              companyInputRef.current?.blur();
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                                  isSelected
                                    ? 'bg-[#006096]/10 text-[#006096]'
                                    : 'bg-[#f5f5f5] text-[#a3a3a3]',
                                )}
                              >
                                <Building2 className="h-2.5 w-2.5" />
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
            {errors.company_id && (
              <span className="col-start-2 text-[10px] text-red-500">
                {errors.company_id.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label className="text-xs text-[#525252]">
              Yacimiento<span className="text-red-500"> *</span>
            </Label>
            <select
              {...register('oilfield')}
              className={cn(
                'h-8 w-full border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                errors.oilfield && 'border-red-400',
              )}
            >
              <option value="">Seleccionar...</option>
              <option value="SCH">SCH - Sierra Chata</option>
              <option value="EMA">EMA - El Mangrullo</option>
            </select>
            {errors.oilfield && (
              <span className="col-start-2 text-[10px] text-red-500">
                {errors.oilfield.message}
              </span>
            )}
          </div>
          <FieldRow
            label="Planta"
            fieldName="plant"
            register={register}
            error={errors.plant?.message}
            required
          />
          <FieldRow
            label="Equipo"
            fieldName="equipment"
            register={register}
            error={errors.equipment?.message}
            required
          />
        </div>
      </CollapsibleSection>

      {/* ── Muestreo ─────────────────────────────────────── */}
      <CollapsibleSection title="Muestreo" defaultOpen>
        <div className="space-y-2">
          <FieldRow
            label="Procedencia"
            fieldName="origin"
            register={register}
            error={errors.origin?.message}
            placeholder="Ej: Pozo SCH 1137"
            required
          />
          <FieldRow
            label="Fecha de muestreo"
            fieldName="sample_date"
            register={register}
            error={errors.sample_date?.message}
            type="date"
            required
          />
          <FieldRow label="Hora" fieldName="sample_time" register={register} type="time" />
          <FieldRow
            label="Muestra de"
            fieldName="sample_description"
            register={register}
            placeholder="Agua"
          />
          <FieldRow label="Extraída por" fieldName="extracted_by" register={register} />
        </div>
      </CollapsibleSection>

      {/* ── Informe ──────────────────────────────────────── */}
      <CollapsibleSection title="Datos del Informe" defaultOpen>
        <div className="space-y-2">
          <FieldRow
            label="Fecha de informe"
            fieldName="report_date"
            register={register}
            error={errors.report_date?.message}
            type="date"
            required
          />
          <FieldRow
            label="N° Informe"
            fieldName="report_number"
            register={register}
            error={errors.report_number?.message}
            required
          />
          <FieldRow label="PDT" fieldName="pdt" register={register} />
          <FieldRow label="Solicitado por" fieldName="requested_by" register={register} />
          <FieldRow label="Análisis requerido" fieldName="requested_analysis" register={register} />
        </div>
      </CollapsibleSection>

      {/* ── Determinaciones In-Situ ──────────────────────── */}
      <CollapsibleSection title="Determinaciones In-Situ" defaultOpen={false}>
        <ParameterFields
          parameters={IN_SITU_PARAMETERS}
          register={register}
          setValue={setValue}
          watch={watch}
        />
      </CollapsibleSection>

      {/* ── Caracteres Físico Químicos ───────────────────── */}
      <CollapsibleSection title="Caracteres Físico Químicos" defaultOpen={false}>
        <ParameterFields
          parameters={CHEMICAL_PARAMETERS}
          register={register}
          setValue={setValue}
          watch={watch}
        />
      </CollapsibleSection>
    </div>
  );
}
