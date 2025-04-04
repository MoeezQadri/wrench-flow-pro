
import { useState } from 'react';
import { useSessionManagement } from './superadmin/useSessionManagement';
import { useAuthentication } from './superadmin/useAuthentication';
import { SuperAdminLoginFormData } from '@/components/superadmin/SuperAdminLoginForm';

export const useSuperAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { checkExistingSession } = useSessionManagement();
  const { handleLogin: authenticate } = useAuthentication();

  const handleLogin = async (values: SuperAdminLoginFormData): Promise<void> => {
    await authenticate(values, setIsLoading);
  };

  return {
    isLoading,
    handleLogin,
    checkExistingSession
  };
};
