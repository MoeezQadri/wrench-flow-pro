
export interface Profile {
  id: string;
  name: string | null;
  email?: string;
  role: string | null;
  is_active: boolean | null;
  organization_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_email?: string;
}

export interface UserWithConfirmation extends Profile {
  email?: string;
  email_confirmed_at?: string | null;
}
