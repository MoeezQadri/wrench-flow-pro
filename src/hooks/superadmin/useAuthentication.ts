import { useAuthContext } from '@/context/AuthContext';

export const useAuthentication = () => {
  const { currentUser } = useAuthContext();
  
  const isSuperAdmin = currentUser?.role === 'superuser';
  
  return {
    isSuperAdmin
  };
};
