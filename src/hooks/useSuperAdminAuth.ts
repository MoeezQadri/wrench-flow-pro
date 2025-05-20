
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSessionManagement } from './superadmin/useSessionManagement';
import { User, UserRole } from '@/types';

export const useSuperAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentUser } = useAuthContext();
  const navigate = useNavigate();
  const { verifySession } = useSessionManagement();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      // Call Supabase Edge Function to authenticate
      const { data, error } = await supabase.functions.invoke('superadmin-login', {
        body: { username: email, password_hash: password }
      });

      if (error) {
        toast.error(error.message || 'Login failed');
        return;
      }

      if (!data.authenticated) {
        toast.error(data.message || 'Invalid credentials');
        return;
      }

      // Store the token in localStorage
      localStorage.setItem('superadmin_token', data.token);

      // Set the current user in context
      const userData: User = {
        id: data.superadmin.id,
        name: data.superadmin.username || 'Super Admin',
        email: email,
        role: 'superuser' as UserRole,
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      setCurrentUser(userData);

      // Navigate to the superadmin dashboard
      toast.success('Login successful');
      navigate('/superadmin/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login');
      console.error('SuperAdmin login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingSession = async (): Promise<boolean> => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      return false;
    }

    try {
      // Verify if the token is valid
      return await verifySession(token);
    } catch (error) {
      console.error('Error verifying session:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear the token
    localStorage.removeItem('superadmin_token');
    
    // Reset user state
    setCurrentUser(null);
    
    // Redirect to login
    navigate('/superadmin/login');
    
    toast.success('Logged out successfully');
  };

  return {
    isLoading,
    handleLogin,
    checkExistingSession,
    logout
  };
};
