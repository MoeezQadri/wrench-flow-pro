
import { supabase } from '@/integrations/supabase/client';

export async function deleteOrganization(orgId: string) {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'delete_organization',
      params: { org_id: orgId }
    }
  });
  
  if (error) throw error;
  return data;
}

export async function createOrganization(params: {
  org_name: string, 
  sub_level: string, 
  owner_name: string, 
  owner_email: string
}) {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'create_organization',
      params: {
        ...params,
        owner_password: Math.random().toString(36).slice(2, 10) // Generate random password
      }
    }
  });
  
  if (error) throw error;
  return data;
}

export async function updateOrganization(params: {
  org_id: string,
  org_name: string,
  sub_level: string
}) {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'update_organization',
      params
    }
  });
  
  if (error) throw error;
  return data;
}

export async function getOrganizations() {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'get_organizations',
      params: {}
    }
  });
  
  if (error) throw error;
  return data || [];
}

// Add a new helper to fetch user profiles
export async function getUserProfiles() {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'get_user_profiles',
      params: {}
    }
  });
  
  if (error) throw error;
  return data || [];
}

// Add a new helper to search for organizations by ID
export async function searchOrganizationById(orgId: string) {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'search_organization',
      params: { org_id: orgId }
    }
  });
  
  if (error) throw error;
  return data || null;
}

// Get inactive users based on a specified number of days
export async function getInactiveUsers(daysInactive: number = 90) {
  const { data, error } = await supabase.rpc('get_inactive_users', { days_inactive: daysInactive });
  
  if (error) throw error;
  return data || [];
}

// Clean user data for the specified user
export async function cleanUserData(userId: string) {
  const { error } = await supabase.rpc('clean_user_data', { user_id: userId });
  
  if (error) throw error;
  return true;
}

// Get all users including confirmation status
export async function getAllUsers() {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'get_all_users',
      params: {}
    }
  });
  
  if (error) throw error;
  return data || [];
}

// Enable a user without email confirmation
export async function enableUserWithoutConfirmation(userId: string) {
  const { data, error } = await supabase.functions.invoke('admin-utils', {
    body: {
      action: 'enable_user_without_confirmation',
      params: { user_id: userId }
    }
  });
  
  if (error) throw error;
  return data;
}
