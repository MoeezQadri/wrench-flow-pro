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
  try {
    console.log('Fetching inactive users for', daysInactive, 'days');
    
    const { data, error } = await supabase.rpc(
      'get_inactive_users', 
      { days_inactive: daysInactive }
    );
    
    if (error) {
      console.error('Error fetching inactive users:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} inactive users`);
    return data || [];
  } catch (e) {
    console.error('Exception in getInactiveUsers:', e);
    throw e;
  }
}

// Clean user data for the specified user
export async function cleanUserData(userId: string) {
  try {
    const { error } = await supabase.rpc('clean_user_data', { user_id: userId });
    
    if (error) {
      console.error('Error cleaning user data:', error);
      throw error;
    }
    
    return true;
  } catch (e) {
    console.error('Exception in cleanUserData:', e);
    throw e;
  }
}

// Get all users including confirmation status
export async function getAllUsers() {
  try {
    console.log('Fetching all users...');
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: {
        action: 'get_all_users',
        params: {}
      }
    });
    
    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} users`);
    return data || [];
  } catch (e) {
    console.error('Exception in getAllUsers:', e);
    throw e;
  }
}

// Enable a user without email confirmation
export async function enableUserWithoutConfirmation(userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: {
        action: 'enable_user_without_confirmation',
        params: { user_id: userId }
      }
    });
    
    if (error) {
      console.error('Error enabling user:', error);
      throw error;
    }
    
    return data;
  } catch (e) {
    console.error('Exception in enableUserWithoutConfirmation:', e);
    throw e;
  }
}

// Check if an email already exists and get its status
export async function checkEmailExists(email: string) {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: {
        action: 'check_email_exists',
        params: { email }
      }
    });
    
    if (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
    
    return data;
  } catch (e) {
    console.error('Exception in checkEmailExists:', e);
    throw e;
  }
}
