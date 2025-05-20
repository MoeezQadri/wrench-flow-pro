import React, { useEffect, useState } from 'react';
import SuperAdminLoginForm from '@/components/superadmin/SuperAdminLoginForm';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
interface LoginData {
  email: string;
  password: string;
}
const SuperAdminLogin = () => {
  const {
    isLoading,
    handleLogin,
    checkExistingSession
  } = useSuperAdminAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const navigate = useNavigate();

  // Check if already authenticated as superadmin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking existing session");
        const isAuthenticated = await checkExistingSession();
        if (isAuthenticated) {
          console.log("User is authenticated, redirecting to dashboard");
          navigate('/superadmin/dashboard');
        } else {
          console.log("No existing session found");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setSessionChecked(true);
      }
    };
    checkAuth();
  }, [checkExistingSession, navigate]);

  // Adapter function to convert form data to the expected format
  const handleFormSubmit = async (data: LoginData) => {
    await handleLogin(data.email, data.password);
  };

  // Show loading state while checking session
  if (!sessionChecked) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="p-6">
          <CardContent className="text-center">
            Checking authentication status...
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mb-4 text-center">
        
        <div className="inline-flex items-center p-2 bg-red-100 text-red-800 rounded">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">SuperAdmin Access Only</span>
        </div>
      </div>
      <SuperAdminLoginForm onSubmit={handleFormSubmit} isLoading={isLoading} />
      <Toaster />
    </div>;
};
export default SuperAdminLogin;