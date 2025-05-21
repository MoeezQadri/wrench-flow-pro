
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export const useAuthentication = () => {
  const { currentUser, session, loading, logout } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  useEffect(() => {
    if (currentUser) {
      // Check if the user is an admin (role is superuser or owner)
      setIsAdmin(currentUser.role === 'superuser' || currentUser.role === 'owner');
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);
  
  return {
    user: currentUser,
    session,
    loading,
    isAuthenticated: !!currentUser,
    isAdmin,
    logout
  };
};
