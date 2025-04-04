
import React, { useEffect } from 'react';
import SuperAdminLoginForm from '@/components/superadmin/SuperAdminLoginForm';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';

const SuperAdminLogin = () => {
  const { isLoading, handleLogin, checkExistingSession } = useSuperAdminAuth();
  const navigate = useNavigate();
  
  // Check if already authenticated as superadmin
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkExistingSession();
      if (isAuthenticated) {
        navigate('/superadmin/dashboard');
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SuperAdminLoginForm 
        onSubmit={handleLogin} 
        isLoading={isLoading} 
      />
      <Toaster />
    </div>
  );
};

export default SuperAdminLogin;
