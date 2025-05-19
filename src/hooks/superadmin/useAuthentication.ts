
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

export const useAuthentication = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentUser } = useAuthContext();
  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call Supabase Edge Function for authentication
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'login', username, password }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.authenticated) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Store token in localStorage
      localStorage.setItem('superadmin_token', data.token);
      
      // Set current user with superadmin role
      const userData = {
        id: data.superadmin.id,
        email: `${username}@admin.system`,
        name: data.superadmin.username,
        role: 'superuser' as UserRole,
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      setCurrentUser(userData as any);
      navigate('/superadmin');
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('superadmin_token');
      setCurrentUser(null);
      navigate('/superadmin/login');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    login,
    logout,
    isLoading,
    error
  };
};

export default useAuthentication;
