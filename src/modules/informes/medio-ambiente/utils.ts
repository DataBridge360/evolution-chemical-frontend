import { ALL_PARAMETERS } from './constants';
import type { EnvironmentReportFormData, EnvironmentReportRecord } from './types';

/**
 * Transforms a backend EnvironmentReportRecord (where each parameter is a
 * JSON string like '{"value":"9.81","unit":"mg/L","method":"SM 4500H-B"}')
 * into the EnvironmentReportFormData shape expected by ReportPreview.
 */
export function parseReportForPreview(record: EnvironmentReportRecord): EnvironmentReportFormData {
  const units: Record<string, string> = {};
  const methods: Record<string, string> = {};

  const data: Record<string, unknown> = {
    company_id: record.company_id || '',
    oilfield: record.oilfield || '',
    localidad: record.localidad || '',
    plant: record.plant || '',
    equipment: record.equipment || '',
    origin: record.origin || '',
    sample_date: record.sample_date || '',
    sample_time: record.sample_time || '',
    report_date: record.report_date || '',
    report_number: record.report_number || '',
    pdt: record.pdt || '',
    sample_description: record.sample_description || 'Agua',
    extracted_by: record.extracted_by || '',
    requested_by: record.requested_by || '',
    requested_analysis: record.requested_analysis || '',
    laboratory: record.laboratory || 'Evolution Chemical',
  };

  for (const param of ALL_PARAMETERS) {
    const raw = record[param.fieldName as keyof EnvironmentReportRecord] as string | undefined;
    if (!raw) {
      data[param.fieldName] = '';
      units[param.fieldName] = param.unit;
      methods[param.fieldName] = param.method;
      continue;
    }

    const text = String(raw).trim();
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        data[param.fieldName] = parsed.value || '';
        units[param.fieldName] = parsed.unit || param.unit;
        methods[param.fieldName] = parsed.method || param.method;
      } catch {
        data[param.fieldName] = text;
        units[param.fieldName] = param.unit;
        methods[param.fieldName] = param.method;
      }
    } else {
      data[param.fieldName] = text;
      units[param.fieldName] = param.unit;
      methods[param.fieldName] = param.method;
    }
  }

  data._units = units;
  data._methods = methods;

  return data as unknown as EnvironmentReportFormData;
}
