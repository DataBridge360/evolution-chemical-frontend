export interface Company {
  company_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  can_view_results: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CreateCompanyDto {
  name: string;
  phone?: string;
  email?: string;
}
