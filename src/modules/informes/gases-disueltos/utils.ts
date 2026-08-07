import type {
  GasesDisueltosReportFormData,
  GasesDisueltosReportRecord,
  GasSamplingPoint,
} from './types';

/**
 * Converts form data into the API payload.
 * Metadata as plain strings; sampling_points serialized as JSON string.
 */
export function serializeGasesDisueltosForApi(
  data: GasesDisueltosReportFormData,
): Record<string, unknown> {
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

  payload.sampling_points = JSON.stringify(data.sampling_points ?? []);

  return payload;
}

/**
 * Transforms a backend record into form data for the preview/form components.
 */
export function parseGasesDisueltosReportForPreview(
  record: GasesDisueltosReportRecord,
): GasesDisueltosReportFormData {
  let samplingPoints: GasSamplingPoint[] = [];

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
    requested_analysis:
      record.requested_analysis || 'Determinación de gases in situ con kit CHEMets',
    laboratory: record.laboratory || 'Evolution Chemical',
    sampling_points:
      samplingPoints.length > 0
        ? samplingPoints
        : [{ plant: '', name: '', co2: '', h2s: '', o2: '' }],
  };
}
