
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSessionManagement } from './superadmin/useSessionManagement';
import { useAuthentication } from './superadmin/useAuthentication';

export const useSuperAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuthContext();
  const navigate = useNavigate();
  const sessionManager = useSessionManagement();
  const { login, logout, error } = useAuthentication();

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await login(username, password);
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
      const isValid = await sessionManager.verifySession(token);
      return isValid;
    } catch (error) {
      console.error('Error checking existing session:', error);
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    
    if (!token) {
      setIsLoading(false);
      navigate('/superadmin/login');
      return;
    }

    // Load is handled in useSessionManagement
    setIsLoading(sessionManager.isLoading);
  }, [navigate, currentUser, sessionManager.isLoading]);

  return { isLoading, handleLogin, checkExistingSession, error };
};

export default useSuperAdminAuth;
