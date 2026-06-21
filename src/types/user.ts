export enum UserRole {
  OWNER = 'owner',
  COMPANY_ADMIN = 'company_admin',
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  company_id: string | null;
  company_name?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
