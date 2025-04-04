
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UpdateLastLoginParams } from '@/types/auth';

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
    isActive: profileData?.is_active ?? true,
    organizationId: profileData?.organization_id || 
      session.user.user_metadata?.organization_id || undefined,
    lastLogin: new Date().toISOString()
  };
};

/**
 * Updates the user's last login time in the database
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  const { error } = await supabase.rpc<any, UpdateLastLoginParams>('update_last_login', {
    user_id: userId,
    login_time: new Date().toISOString()
  });
  
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
