
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import SuperAdminLoginForm, { SuperAdminLoginFormData } from '@/components/superadmin/SuperAdminLoginForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { verifySuperAdminToken } from '@/utils/auth-utils';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';
import { toast as useToast } from '@/hooks/use-toast';

const SuperAdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    setCurrentUser,
    setSession,
  } = useAuthContext();

  const handleSuperAdminLogin = async (values: SuperAdminLoginFormData): Promise<void> => {
    setIsLoading(true);
    try {
      console.log({ values });
      // First try with standard Supabase authentication
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      console.log({ supabaseData })
      if (supabaseData?.session) {
        // Check if the user has superadmin metadata or role
        const userMetadata = supabaseData.user?.user_metadata || {};
        if (userMetadata.role === 'superuser' || userMetadata.role === 'superadmin' || userMetadata.role === 'owner') {
          // If standard auth failed or user is not superadmin, try with custom superadmin auth
          const response = await supabase.functions.invoke('admin-utils', {
            body: {
              action: 'authenticate_superadmin',
              params: {
                userid: supabaseData.user.id
              }
            }
          });

          if (response.error) {
            throw new Error(response.error.message || 'Authentication failed');
          }

          const { authenticated, token, superadmin } = response.data;

          if (!authenticated || !token) {
            useToast({
              variant: "destructive",
              title: "Access denied",
              description: "Invalid credentials. Please try again.",
            });
            setIsLoading(false);
            return;
          }

          // Store superadmin token
          localStorage.setItem('superadminToken', token);
          localStorage.setItem('access_token', supabaseData.session.access_token);


          // Configure Supabase functions to use the token
          supabase.functions.setAuth(supabaseData.session.access_token);

          // Create a mock session for the superadmin
          const mockSession = {
            access_token: token,
            refresh_token: '',
            expires_at: Date.now() + 24 * 3600000, // 24 hours from now
            user: {
              id: superadmin.id,
              email: values.email,
              user_metadata: {
                name: 'Super Admin',
                role: 'superuser'
              }
            }
          };

          // Create a superadmin user object for context
          const superadminUser: User = {
            id: superadmin.id,
            email: values.email,
            name: 'Super Admin',
            role: 'superuser' as UserRole,
            is_active: true,
            lastLogin: new Date().toISOString(),
            created_at: supabaseData.user.created_at,

          };

          // Update auth context with superadmin user
          setCurrentUser(superadminUser);
          setSession(mockSession as any);

          useToast({
            title: "Access granted",
            description: "Welcome to the SuperAdmin portal",
          });

          navigate('/superadmin/dashboard');
          return;
        } else {
          // Not a superadmin, sign out
          await supabase.auth.signOut();
        }
      }


    } catch (error) {
      console.error('Login error:', error);
      useToast({
        variant: "destructive",
        title: "Authentication error",
        description: error instanceof Error ? error.message : "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: SuperAdminLoginFormData) => {
    setIsLoading(true);
    try {
      console.log('Attempting SuperAdmin login with:', { email: data.email });

      // Need to hash the password for security - this is just a simple hash for demonstration
      // In production, use a more secure hashing algorithm
      const passwordHash = await hashPassword(data.password);

      // Call our edge function to authenticate
      const { data: loginData, error } = await supabase.functions.invoke('superadmin-login', {
        body: { username: data.email, password_hash: passwordHash }
      });

      console.log('SuperAdmin login response:', loginData);

      if (error) {
        console.error('SuperAdmin login error:', error);
        toast.error(`Login failed: ${error.message}`);
        return;
      }

      if (!loginData.authenticated) {
        toast.error(`Login failed: ${loginData.message || 'Invalid credentials'}`);
        return;
      }

      // Store the superadmin token
      if (loginData.token) {
        // Verify the token
        const verified = await verifySuperAdminToken(loginData.token);

        if (verified) {
          // Store token in localStorage
          localStorage.setItem('superadmin_token', loginData.token);

          toast.success('Successfully authenticated as SuperAdmin');
          // Navigate to SuperAdmin dashboard
          navigate('/superadmin/dashboard');
          return;
        } else {
          toast.error('Failed to verify authentication token');
          return;
        }
      }

      // If we get here, something went wrong with verification
      toast.error('Failed to verify authentication token');

    } catch (err) {
      console.error('Unexpected error during login:', err);
      toast.error(`An unexpected error occurred: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple hash function for password - in production use a proper hashing library
  const hashPassword = async (password: string): Promise<string> => {
    // This is a simple implementation - in production use a proper hashing algorithm
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="mb-8 text-center">
        <Logo size="lg" />
        <h1 className="mt-4 text-2xl font-bold">Super Admin Access</h1>
        <p className="text-gray-600 mt-1">Restricted area for system administrators</p>
      </div>

      <SuperAdminLoginForm onSubmit={handleSuperAdminLogin} isLoading={isLoading} />

      <Card className="mt-8 w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-xs text-gray-500">
            <p className="mb-1">This area is restricted to system administrators only.</p>
            <p>If you need access, please contact your system administrator.</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Return to main application
        </a>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
