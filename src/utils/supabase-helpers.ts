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
 * Get all users with profile data via the superadmin edge function
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-utils', {
      body: { action: 'get_users' }
    });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return data.users || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
