
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Organization, Profile } from '@/components/admin/types';

// Verify the token with Supabase
export const verifySuperAdminToken = async (token: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-superadmin-token', {
      body: { token }
    });
    
    if (error) {
      console.error('Error verifying token:', error);
      return { isValid: false, userId: null, username: null };
    }
    
    return {
      isValid: data?.isValid || false,
      userId: data?.userId || null,
      username: data?.username || null
    };
  } catch (error) {
    console.error('Unexpected error verifying token:', error);
    return { isValid: false, userId: null, username: null };
  }
};

// Fetch all organizations
export const fetchOrganizations = async (): Promise<Organization[]> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data as Organization[];
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return [];
  }
};

// Fetch all users with their profiles
export const fetchUsers = async (): Promise<Profile[]> => {
  try {
    // Use from() instead of rpc() to query the view
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (error) throw error;
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data format returned from user_profiles:', data);
      return [];
    }
    
    return data.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login: user.last_sign_in_at || user.lastLogin,
      created_at: user.created_at,
      organization_id: user.organization_id,
      email_confirmed: user.email_confirmed_at !== null
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Update a user's status
export const updateUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
};

// Delete an organization
export const deleteOrganization = async (orgId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting organization:', error);
    return false;
  }
};
