
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
      // Set the token for the verification request
      supabase.functions.setAuth(token);
      
      // Make a test request
      const { error } = await supabase.functions.invoke('admin-utils', {
        body: { action: 'get_organizations', params: {} }
      });
      
      if (!error) {
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
      const isValid = await verifyToken(superAdminToken);
      if (isValid) {
        navigate('/superadmin/dashboard');
        return true;
      }
    }
    return false;
  };

  const handleLogin = async (values: SuperAdminLoginFormData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would verify with a secure backend
      // For demo purposes, we're using hardcoded credentials
      if (values.username === 'admin' && values.password === 'superadmin2023') {
        // Generate a mock token for superadmin
        const mockToken = `superadmin-${Date.now()}`;
        
        // Store the token in localStorage
        localStorage.setItem('superadminToken', mockToken);
        
        // Set the auth header for all subsequent Supabase function calls
        supabase.functions.setAuth(mockToken);
        
        // Create a mock superadmin user object for context
        const superadminUser = {
          id: 'superadmin-id',
          email: 'superadmin@example.com',
          name: 'Super Admin',
          role: 'superuser' as UserRole,
          isActive: true,
          lastLogin: new Date().toISOString()
        };
        
        // Update auth context with superadmin user
        setCurrentUser(superadminUser);
        setSession({
          access_token: mockToken,
          refresh_token: '',
          token_type: 'bearer',
          expires_at: Date.now() + 3600000, // 1 hour from now
          expires_in: 3600,
          user: {
            id: 'superadmin-id',
            email: 'superadmin@example.com',
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
          const { error: testError } = await supabase.functions.invoke('admin-utils', {
            body: { action: 'get_organizations', params: {} }
          });
          
          if (testError) {
            console.error('Error testing admin token:', testError);
            
            toast({
              variant: "destructive",
              title: "Authentication Failed",
              description: "Please try again."
            });
            return;
          }
          
          // Redirect to the dashboard with a slight delay to ensure token is set
          setTimeout(() => {
            navigate('/superadmin/dashboard');
          }, 300);
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
