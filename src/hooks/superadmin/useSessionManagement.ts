
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export const useSessionManagement = () => {
  const { currentUser, session, loading, logout } = useAuthContext();
  const [isValid, setIsValid] = useState<boolean>(false);
  
  useEffect(() => {
    const validateSession = async () => {
      // Check if we have a valid session
      if (session) {
        setIsValid(true);
      } else {
        setIsValid(false);
      }
    };
    
    validateSession();
  }, [session]);
  
  return {
    isSessionValid: isValid && !loading && !!currentUser,
    loading,
    logout
  };
};
