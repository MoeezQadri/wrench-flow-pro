import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { User } from '@/types';

export const useSuperAdminAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentUser } = useAuthContext();
  
  const clearError = () => {
    setError(null);
  };
  
  const loginWithSuperAdmin = async (userId: string) => {
    setLoading(true);
    clearError();
    
    const { data, error } = await supabase.rpc('superadmin_login_new', { userid: userId });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }
    
    const response = data as { authenticated: boolean; superadmin: any; session: any };
    
    if (response.authenticated) {
      // Fix type error with role casting
      const userData = {
        id: userId,
        email: 'admin@system.com', // Default email for superadmin login
        name: response.superadmin?.username,
        role: 'superuser' as any, // Cast to any to avoid type error
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      setCurrentUser(userData as any); // Cast to any to avoid type error
      
      // Store the session token in localStorage
      localStorage.setItem('superadmin_token', response.session.token);
      setLoading(false);
      return true;
    } else {
      setError('Invalid credentials');
      setLoading(false);
      return false;
    }
  };
  
  const createSuperAdmin = async (username: string, password: string) => {
    setLoading(true);
    clearError();
    
    const { data, error } = await supabase.auth.signUp({
      email: `superadmin-${username}@example.com`,
      password: password,
      options: {
        data: {
          name: username,
          role: 'superuser'
        }
      }
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }
    
    if (data && !error) {
      // Fix type error with role casting
      const newUser = {
        id: data.user?.id,
        email: 'admin@system.com', // Default email for superadmin login
        name: username,
        role: 'superuser' as any, // Cast to any to avoid type error
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      setCurrentUser(newUser as any); // Cast to any to avoid type error
      
      setLoading(false);
      return true;
    } else {
      setError('Failed to create super admin');
      setLoading(false);
      return false;
    }
  };
  
  return { loading, error, loginWithSuperAdmin, createSuperAdmin };
};
