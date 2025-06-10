
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface SuperAdmin {
  id: string;
  username: string;
  is_active: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  superadmin: SuperAdmin | null;
  token: string | null;
  loading: boolean;
}

export const useSuperAdminAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    superadmin: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('superadmin_token');
    const superadminData = localStorage.getItem('superadmin_data');

    if (token && superadminData) {
      try {
        const superadmin = JSON.parse(superadminData);
        setAuthState({
          isAuthenticated: true,
          superadmin: {
            id: superadmin.id,
            username: superadmin.username,
            is_active: superadmin.is_active
          },
          token,
          loading: false,
        });
      } catch (error) {
        console.error('Error parsing superadmin data:', error);
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_data');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('superadmin_login', {
        username,
        password_hash: password, // In production, this should be hashed
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (result.authenticated) {
        const superadmin = {
          id: result.superadmin.id,
          username: result.superadmin.username,
          is_active: true
        };

        localStorage.setItem('superadmin_token', result.token);
        localStorage.setItem('superadmin_data', JSON.stringify(superadmin));

        setAuthState({
          isAuthenticated: true,
          superadmin,
          token: result.token,
          loading: false,
        });

        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_data');
    setAuthState({
      isAuthenticated: false,
      superadmin: null,
      token: null,
      loading: false,
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
};
