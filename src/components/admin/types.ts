
import { User, UserRole } from '@/types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  organization_id?: string;
  email_confirmed?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
  logo?: string;
  trial_ends_at?: string;
  address?: string;
  phone?: string;
  email?: string;
  country?: string;
  currency?: string;
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
  users: Profile[];
  setUsers: React.Dispatch<React.SetStateAction<Profile[]>>;
  organizations: Organization[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}

export interface OrganizationManagementProps {
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}
