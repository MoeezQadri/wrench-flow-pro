
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { SuperAdminLoginFormData } from '@/components/superadmin/SuperAdminLoginForm';

export const useSuperAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentUser, setSession } = useAuthContext();

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      // Clear any existing auth
      supabase.functions.setAuth(null);
      
      // Set the token for the verification request
      supabase.functions.setAuth(token);
      
      // Make a test request
      const { data, error } = await supabase.functions.invoke('admin-utils', {
        body: { action: 'verify_token', params: {} }
      });
      
      if (!error && data?.verified === true) {
        console.log("Token verification successful:", data);
        return true;
      } else {
        // Token is invalid, clear it
        console.error("Invalid superadmin token:", error);
        localStorage.removeItem('superadminToken');
        // Reset auth
        supabase.functions.setAuth(null);
        return false;
      }
    } catch (err) {
      console.error("Token verification error:", err);
      localStorage.removeItem('superadminToken');
      supabase.functions.setAuth(null);
      return false;
    }
  };

  const checkExistingSession = async (): Promise<boolean> => {
    const superAdminToken = localStorage.getItem('superadminToken');
    if (superAdminToken) {
      try {
        const isValid = await verifyToken(superAdminToken);
        if (isValid) {
          toast({
            title: "Session restored",
            description: "Welcome back, SuperAdmin",
          });
          navigate('/superadmin/dashboard');
          return true;
        } else {
          console.log("Existing token invalid, user needs to log in");
        }
      } catch (err) {
        console.error("Error checking existing session:", err);
      }
    }
    return false;
  };

  const handleLogin = async (values: SuperAdminLoginFormData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear any existing tokens first
      localStorage.removeItem('superadminToken');
      supabase.functions.setAuth(null);
      
      // Fixed credentials - in a real app you'd want these in a secure database
      // Note: Added two sets of valid credentials
      const validCredentials = [
        { username: 'admin', password: 'superadmin2023' },
        { username: 'superadmin', password: 'admin1234' }
      ];
      
      const isValid = validCredentials.some(
        cred => cred.username === values.username && cred.password === values.password
      );
      
      if (isValid) {
        // Generate a JSON Web Token-like structure for better compatibility
        // Format: header.payload.signature (mocked for demo purposes)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ 
          sub: 'superadmin-id',
          name: values.username,
          role: 'superuser',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
        }));
        const signature = btoa(Math.random().toString(36).substring(2, 15));
        
        // Create a more standard JWT-like token structure
        const mockToken = `${header}.${payload}.${signature}`;
        
        // Store the token in localStorage with superadmin prefix for easy identification
        const superadminToken = `superadmin-${mockToken}`;
        localStorage.setItem('superadminToken', superadminToken);
        
        // Set the auth header for all subsequent Supabase function calls
        supabase.functions.setAuth(superadminToken);
        
        // Create a mock superadmin user object for context
        const superadminUser = {
          id: 'superadmin-id',
          email: values.username + '@admin.system',
          name: 'Super Admin',
          role: 'superuser' as UserRole,
          isActive: true,
          lastLogin: new Date().toISOString()
        };
        
        // Update auth context with superadmin user
        setCurrentUser(superadminUser);
        setSession({
          access_token: superadminToken,
          refresh_token: '',
          token_type: 'bearer',
          expires_at: Date.now() + 86400000, // 24 hours from now
          expires_in: 86400,
          user: {
            id: 'superadmin-id',
            email: values.username + '@admin.system',
            app_metadata: {},
            user_metadata: {
              name: 'Super Admin',
              role: 'superuser'
            },
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        });
        
        toast({
          title: "Access granted",
          description: "Welcome to the SuperAdmin portal",
        });
        
        // Verify the token works before redirecting
        try {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('admin-utils', {
            body: { action: 'verify_token', params: {} }
          });
          
          if (verifyError || !verifyData?.verified) {
            console.error('Error verifying admin token:', verifyError);
            
            toast({
              variant: "destructive",
              title: "Authentication Failed",
              description: "There was an issue with the token verification."
            });
            return;
          }
          
          console.log("Token verification successful, redirecting to dashboard");
          
          // Redirect to the dashboard with a slight delay to ensure token is set
          setTimeout(() => {
            navigate('/superadmin/dashboard');
          }, 500);
        } catch (verifyError) {
          console.error('Error verifying token:', verifyError);
          
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Please try again."
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Invalid username or password. Please try again.",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleLogin,
    checkExistingSession
  };
};
