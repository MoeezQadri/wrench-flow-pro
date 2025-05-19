
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
    
    return data.map(org => ({
      id: org.id,
      name: org.name,
      subscription_level: org.subscription_level,
      subscription_status: org.subscription_status,
      trial_ends_at: org.trial_ends_at || '',
      logo: org.logo || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || '',
      country: org.country || '',
      currency: org.currency || '',
      created_at: org.created_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return [];
  }
};

// Fetch all users with their profiles
export const fetchUsers = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_users_with_profiles');
    
    if (error) throw error;
    
    return data.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      organization_id: user.organization_id,
      email_confirmed: user.email_confirmed
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
