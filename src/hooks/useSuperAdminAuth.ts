
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSessionManagement } from './superadmin/useSessionManagement';

export const useSuperAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuthContext();
  const navigate = useNavigate();
  const sessionManager = useSessionManagement();

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

  return { isLoading };
};

export default useSuperAdminAuth;
