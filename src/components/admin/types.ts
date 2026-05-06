import { User, UserRole } from '@/types';

export interface UserWithConfirmation extends Profile {
  email_confirmed_at?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  lastLogin?: string;
  created_at?: string;
  organization_id?: string;
  email_confirmed?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
  suspended?: boolean;
  next_billing_date?: string;
  logo?: string;
  trial_ends_at?: string;
  address?: string;
  phone?: string;
  email?: string;
  user_id?: string;
  country?: string;
  currency?: string;
  created_at: string;
  updated_at?: string;
  total_billed?: string;
  billing_interval?: string;
  user_role?: UserRole;
}

export interface RoleResource {
  name: string;
  permissions: {
    [key: string]: boolean;
    view: boolean;
    manage: boolean;
  };
}

export interface UserManagementProps {
  users: UserWithConfirmation[];
  setUsers: React.Dispatch<React.SetStateAction<UserWithConfirmation[]>>;
  organizations: Organization[];
  setOrganizations?: React.Dispatch<React.SetStateAction<Organization[]>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  loadData: () => Promise<void>;
}

export interface OrganizationManagementProps {
  organizations: Organization[];
  setOrganizations?: React.Dispatch<React.SetStateAction<Organization[]>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}
