
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
