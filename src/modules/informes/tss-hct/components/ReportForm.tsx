'use client';

import {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  useFieldArray,
  Control,
} from 'react-hook-form';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { type TssHctReportFormData } from '../types';
import { EMPTY_SAMPLING_POINT } from '../constants';
import { Building2, Check, ChevronDown, Plus, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { cn } from '@/src/lib/utils';
import type { Company } from '@/src/types/company';

interface ReportFormProps {
  register: UseFormRegister<TssHctReportFormData>;
  errors: FieldErrors<TssHctReportFormData>;
  setValue: UseFormSetValue<TssHctReportFormData>;
  watch: UseFormWatch<TssHctReportFormData>;
  control: Control<TssHctReportFormData>;
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
  fieldName: keyof TssHctReportFormData;
  register: UseFormRegister<TssHctReportFormData>;
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
          {...register(fieldName as 'plant')}
          type={type}
          placeholder={placeholder}
          className={cn('h-8 text-xs', error && 'border-red-400')}
        />
        {error && <span className="text-[10px] text-red-500">{error}</span>}
      </div>
    </div>
  );
}

export function ReportForm({
  register,
  errors,
  setValue,
  watch,
  control,
  selectedCompany,
  onCompanySelect,
}: ReportFormProps) {
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const companyInputRef = useRef<HTMLInputElement>(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sampling_points',
  });

  const includeH2s = watch('include_h2s');
  const includeCo2 = watch('include_co2');

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
          obligatorios.
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

          {/* Oilfield */}
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
        </div>
      </CollapsibleSection>

      {/* ── Muestreo ─────────────────────────────────────── */}
      <CollapsibleSection title="Muestreo" defaultOpen>
        <div className="space-y-2">
          <FieldRow
            label="Procedencia"
            fieldName="origin"
            register={register}
            placeholder="Ej: Yacimiento Sierra Chata PTG 01"
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
          <FieldRow
            label="Extraída por"
            fieldName="extracted_by"
            register={register}
            placeholder="Evolution Chemical SRL"
          />
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

      {/* ── Parámetros opcionales ─────────────────────────── */}
      <CollapsibleSection title="Columnas opcionales" defaultOpen>
        <p className="mb-3 text-[11px] text-[#737373]">
          Activá las columnas adicionales si el informe incluye gases disueltos.
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-[#525252]">
            <input
              type="checkbox"
              checked={includeH2s}
              onChange={(e) => setValue('include_h2s', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#d4d4d4]"
            />
            Incluir H2S disuelto (mg/L)
          </label>
          <label className="flex items-center gap-2 text-xs text-[#525252]">
            <input
              type="checkbox"
              checked={includeCo2}
              onChange={(e) => setValue('include_co2', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#d4d4d4]"
            />
            Incluir CO2 disuelto (mg/L)
          </label>
        </div>
      </CollapsibleSection>

      {/* ── Puntos de Muestreo ────────────────────────────── */}
      <CollapsibleSection title="Puntos de Muestreo" defaultOpen>
        <p className="mb-3 text-[11px] text-[#737373]">
          Agregá los puntos de muestreo con sus valores.
        </p>

        {/* Table header */}
        <div
          className={cn(
            'mb-1 grid items-center gap-1 px-0.5',
            includeH2s && includeCo2
              ? 'grid-cols-[1fr_60px_60px_60px_60px_24px]'
              : includeH2s || includeCo2
                ? 'grid-cols-[1fr_60px_60px_60px_24px]'
                : 'grid-cols-[1fr_60px_60px_24px]',
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
            Punto
          </span>
          <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
            TSS
          </span>
          <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
            HcT
          </span>
          {includeH2s && (
            <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
              H2S
            </span>
          )}
          {includeCo2 && (
            <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
              CO2
            </span>
          )}
          <span />
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                'grid items-center gap-1',
                includeH2s && includeCo2
                  ? 'grid-cols-[1fr_60px_60px_60px_60px_24px]'
                  : includeH2s || includeCo2
                    ? 'grid-cols-[1fr_60px_60px_60px_24px]'
                    : 'grid-cols-[1fr_60px_60px_24px]',
              )}
            >
              <Input
                {...register(`sampling_points.${index}.name`)}
                className="h-7 text-xs"
                placeholder="Ej: Separador V-1030"
              />
              <Input
                {...register(`sampling_points.${index}.tss`)}
                className="h-7 text-center text-xs"
                placeholder="—"
              />
              <Input
                {...register(`sampling_points.${index}.hct`)}
                className="h-7 text-center text-xs"
                placeholder="—"
              />
              {includeH2s && (
                <Input
                  {...register(`sampling_points.${index}.h2s`)}
                  className="h-7 text-center text-xs"
                  placeholder="—"
                />
              )}
              {includeCo2 && (
                <Input
                  {...register(`sampling_points.${index}.co2`)}
                  className="h-7 text-center text-xs"
                  placeholder="—"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (fields.length > 1) remove(index);
                }}
                disabled={fields.length <= 1}
                className="flex h-7 w-7 items-center justify-center rounded text-[#a3a3a3] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {errors.sampling_points?.message && (
          <span className="mt-1 block text-[10px] text-red-500">
            {errors.sampling_points.message}
          </span>
        )}

        <button
          type="button"
          onClick={() => append({ ...EMPTY_SAMPLING_POINT })}
          className="mt-2 flex items-center gap-1 rounded-md border border-dashed border-[#d4d4d4] px-3 py-1.5 text-xs text-[#737373] transition-colors hover:border-[#006096] hover:text-[#006096]"
        >
          <Plus className="h-3 w-3" />
          Agregar punto
        </button>
      </CollapsibleSection>
    </div>
  );
}
