export enum Localidad {
  CUTRAL_CO = 'cutral_co',
  RINCON = 'rincon',
}

export const LOCALIDAD_LABELS: Record<Localidad, string> = {
  [Localidad.CUTRAL_CO]: 'Cutral-Có',
  [Localidad.RINCON]: 'Rincón de los Sauces',
};

export interface Company {
  company_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  localidad: Localidad;
  can_view_results: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CreateCompanyDto {
  name: string;
  phone?: string;
  email?: string;
  localidad: Localidad;
}
