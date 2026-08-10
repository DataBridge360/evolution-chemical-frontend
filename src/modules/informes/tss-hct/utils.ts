import type { TssHctReportFormData, TssHctReportRecord, SamplingPoint } from './types';

/**
 * Converts form data into the API payload.
 * Metadata fields go as plain strings; sampling_points is serialized as a JSON string.
 */
export function serializeTssHctForApi(data: TssHctReportFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  const metaFields = [
    'company_id',
    'oilfield',
    'localidad',
    'plant',
    'origin',
    'sample_date',
    'sample_time',
    'report_date',
    'report_number',
    'pdt',
    'sample_description',
    'extracted_by',
    'requested_by',
    'requested_analysis',
    'laboratory',
  ] as const;

  for (const key of metaFields) {
    payload[key] = data[key] ?? '';
  }

  payload.include_h2s = data.include_h2s ?? false;
  payload.include_co2 = data.include_co2 ?? false;
  payload.sampling_points = JSON.stringify(data.sampling_points ?? []);

  return payload;
}

/**
 * Transforms a backend TssHctReportRecord into the form data shape
 * expected by the preview and form components.
 */
export function parseTssHctReportForPreview(record: TssHctReportRecord): TssHctReportFormData {
  let samplingPoints: SamplingPoint[] = [];

  if (record.sampling_points) {
    const raw = String(record.sampling_points).trim();
    if (raw.startsWith('[')) {
      try {
        samplingPoints = JSON.parse(raw);
      } catch {
        samplingPoints = [];
      }
    }
  }

  return {
    company_id: record.company_id || '',
    oilfield: record.oilfield || '',
    localidad: record.localidad || '',
    plant: record.plant || '',
    origin: record.origin || '',
    sample_date: record.sample_date || '',
    sample_time: record.sample_time || '',
    report_date: record.report_date || '',
    report_number: record.report_number || '',
    pdt: record.pdt || '',
    sample_description: record.sample_description || 'Agua',
    extracted_by: record.extracted_by || 'Evolution Chemical SRL',
    requested_by: record.requested_by || '',
    requested_analysis: record.requested_analysis || '',
    laboratory: record.laboratory || 'Evolution Chemical',
    include_h2s: record.include_h2s ?? false,
    include_co2: record.include_co2 ?? false,
    sampling_points:
      samplingPoints.length > 0
        ? samplingPoints
        : [{ name: '', tss: '', hct: '', h2s: '', co2: '' }],
  };
}
