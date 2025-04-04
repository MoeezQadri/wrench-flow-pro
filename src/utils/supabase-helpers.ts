
import { supabase } from '@/integrations/supabase/client';

/**
 * Get all organizations via the superadmin edge function
 */
export const getOrganizations = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { action: 'get_organizations' }
    });
    
    if (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
    
    return data.organizations || [];
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
};

/**
 * Get all users with profile data via direct query
 */
export const getAllUsers = async () => {
  try {
    // Instead of using RPC, fetch users directly
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) {
      console.warn('Error fetching profiles, falling back to edge function:', profilesError);
      return getAdminUsers();
    }
    
    return profiles || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

/**
 * Alternative method to get users via the admin-utils edge function
 */
export const getAdminUsers = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { action: 'get_users' }
    });
    
    if (error) {
      console.error('Error fetching users via admin-utils:', error);
      throw error;
    }
    
    return data.users || [];
  } catch (error) {
    console.error('Failed to fetch users via admin-utils:', error);
    throw error;
  }
};

/**
 * Get inactive users that have been inactive for specified days
 */
export const getInactiveUsers = async (daysInactive: number = 90) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { 
        action: 'get_inactive_users',
        params: { days_inactive: daysInactive }
      }
    });
    
    if (error) {
      console.error('Error fetching inactive users:', error);
      throw error;
    }
    
    return data.users || [];
  } catch (error) {
    console.error('Failed to fetch inactive users:', error);
    throw error;
  }
};

/**
 * Clean user data via the superadmin edge function
 */
export const cleanUserData = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { 
        action: 'clean_user_data',
        params: { user_id: userId }
      }
    });
    
    if (error) {
      console.error('Error cleaning user data:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to clean user data:', error);
    throw error;
  }
};

/**
 * Delete an organization via the superadmin edge function
 */
export const deleteOrganization = async (orgId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { 
        action: 'delete_organization',
        params: { org_id: orgId }
      }
    });
    
    if (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to delete organization:', error);
    throw error;
  }
};

/**
 * Update an organization via the superadmin edge function
 */
export const updateOrganization = async (params: {
  org_id: string;
  org_name: string;
  sub_level: string;
  sub_status?: string;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { 
        action: 'update_organization',
        params
      }
    });
    
    if (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to update organization:', error);
    throw error;
  }
};

/**
 * Create a new organization via the superadmin edge function
 */
export const createOrganization = async (params: {
  org_name: string;
  sub_level: string;
  owner_name: string;
  owner_email: string;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { 
        action: 'create_organization',
        params
      }
    });
    
    if (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw error;
  }
};

/**
 * Search for an organization by ID via the superadmin edge function
 */
export const searchOrganizationById = async (orgId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { 
        action: 'search_organization_by_id',
        params: { org_id: orgId }
      }
    });
    
    if (error) {
      console.error('Error searching for organization:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to search for organization:', error);
    throw error;
  }
};

/**
 * Enable a user without requiring email confirmation
 */
export const enableUserWithoutConfirmation = async (userId: string) => {
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
  } catch (error) {
    console.error('Failed to enable user:', error);
    throw error;
  }
};

/**
 * Check if an email already exists and its status
 */
export const checkEmailExists = async (email: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { 
        action: 'check_email_exists',
        params: { email }
      }
    });
    
    if (error) {
      console.error('Error checking email:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to check email:', error);
    throw error;
  }
};
