
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useTokenVerification } from './useTokenVerification';
import { SuperAdminLoginFormData } from '@/components/superadmin/SuperAdminLoginForm';

export const useAuthentication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCurrentUser, setSession } = useAuthContext();
  const { verifyToken } = useTokenVerification();

  const handleLogin = async (values: SuperAdminLoginFormData, setIsLoading: (loading: boolean) => void): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear any existing tokens first
      localStorage.removeItem('superadminToken');
      
      // Authenticate against the database via the edge function
      const { data, error } = await supabase.functions.invoke('admin-utils', {
        body: { 
          action: 'authenticate_superadmin',
          params: {
            username: values.username,
            password: values.password
          }
        }
      });
      
      if (error) {
        console.error('Authentication error:', error);
        throw new Error('Authentication failed');
      }
      
      if (!data.authenticated) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: data.message || "Invalid username or password. Please try again.",
        });
        setIsLoading(false);
        return;
      }
      
      // Store the token
      localStorage.setItem('superadminToken', data.token);
      
      // Set the token for future API calls
      supabase.functions.setAuth(data.token);
      
      // Create a superadmin user object for context
      const superadminUser = {
        id: data.superadmin.id || 'superadmin-id',
        email: `${data.superadmin.username}@admin.system`,
        name: 'Super Admin',
        role: 'superuser' as UserRole,
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      // Update auth context with superadmin user
      setCurrentUser(superadminUser);
      setSession({
        access_token: data.token,
        refresh_token: '',
        token_type: 'bearer',
        expires_at: Date.now() + 86400000, // 24 hours from now
        expires_in: 86400,
        user: {
          id: data.superadmin.id || 'superadmin-id',
          email: `${data.superadmin.username}@admin.system`,
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
        const isValid = await verifyToken(data.token);
        
        if (!isValid) {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: "There was an issue with the token verification."
          });
          setIsLoading(false);
          return;
        }
        
        console.log("Token verification successful, redirecting to dashboard");
        
        // Redirect to the dashboard
        navigate('/superadmin/dashboard');
      } catch (verifyError) {
        console.error('Error verifying token:', verifyError);
        
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please try again."
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "An error occurred during authentication.",
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLogin
  };
};
