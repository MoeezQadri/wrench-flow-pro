
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if the current URL contains email confirmation parameters
 * and redirects to login if needed
 */
export const handleEmailConfirmation = async (): Promise<boolean> => {
  const url = window.location.href;
  if (url.includes('#access_token=') && url.includes('type=signup')) {
    // User has confirmed their email - redirect to login
    window.location.href = '/auth/login';
    return true;
  }
  return false;
};

/**
 * Creates a user object from session and profile data
 */
export const createUserFromSession = (
  session: Session, 
  profileData?: any
): User => {
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: profileData?.name || 
      session.user.user_metadata?.name || 
      session.user.email?.split('@')[0] || '',
    role: profileData?.role || 
      session.user.user_metadata?.role || 'owner',
    is_active: profileData?.is_active ?? true,
    organizationId: profileData?.organization_id || 
      session.user.user_metadata?.organization_id || undefined,
    lastLogin: new Date().toISOString()
  };
};

/**
 * Updates the user's last login time in the database
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  const params = {
    user_id: userId,
    login_time: new Date().toISOString()
  };
  
  // Use direct SQL query instead of RPC function since it's not in the TypeScript types
  const { error } = await supabase
    .from('profiles')
    .update({ lastLogin: params.login_time })
    .eq('id', params.user_id);
  
  if (error) {
    console.error('Error updating last login:', error);
  }
};

/**
 * Fetches the user's profile data from the database
 */
export const fetchUserProfile = async (userId: string) => {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileError);
  }
  
  return { profileData, profileError };
};

/**
 * Verify SuperAdmin token
 */
export const verifySuperAdminToken = async (token: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-superadmin-token', {
      body: { token }
    });
    
    if (error) {
      console.error('Error verifying superadmin token:', error);
      return false;
    }
    
    return data?.verified === true;
  } catch (error) {
    console.error('Error verifying superadmin token:', error);
    return false;
  }
};
