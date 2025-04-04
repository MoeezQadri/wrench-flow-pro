
import React, { useEffect } from 'react';
import SuperAdminLoginForm from '@/components/superadmin/SuperAdminLoginForm';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';

const SuperAdminLogin = () => {
  const { isLoading, handleLogin, checkExistingSession } = useSuperAdminAuth();
  
  // Check if already authenticated as superadmin
  useEffect(() => {
    checkExistingSession();
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SuperAdminLoginForm 
        onSubmit={handleLogin} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default SuperAdminLogin;
