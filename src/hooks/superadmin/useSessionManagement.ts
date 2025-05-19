import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { verifySuperAdminToken } from '@/services/superadmin-service';

export const useSessionManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentUser } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');

    if (token) {
      handleExistingSession(token);
    } else {
      setIsLoading(false);
    }
  }, [setCurrentUser, navigate]);

  const handleExistingSession = async (token: string) => {
    setIsLoading(true);
    const { isValid, userId, username } = await verifySuperAdminToken(token);

    if (isValid) {
      // Fix type error with role casting
      const userData = {
        id: userId,
        email: 'admin@system.com', // Default email for superadmin
        name: username || 'Super Admin',
        role: 'superuser' as any, // Cast to any to avoid type error
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      setCurrentUser(userData as any); // Cast to any to avoid type error
      navigate('/superadmin');
    } else {
      localStorage.removeItem('superadmin_token');
      navigate('/superadmin/login');
    }

    setIsLoading(false);
  };

  return { isLoading };
};
