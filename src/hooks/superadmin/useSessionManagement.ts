
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

  const verifySession = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('verify_superadmin_token', { token });
      
      if (error) {
        console.error('Error verifying session:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Exception verifying session:', error);
      return false;
    }
  };
  
  return {
    isSessionValid: isValid && !loading && !!currentUser,
    loading,
    logout,
    verifySession
  };
};
