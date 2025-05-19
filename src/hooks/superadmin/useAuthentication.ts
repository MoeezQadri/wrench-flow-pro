
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole, User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLoginFormData } from '@/components/superadmin/SuperAdminLoginForm';

export const useAuthentication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCurrentUser, setSession } = useAuthContext();

  const handleLogin = async (values: SuperAdminLoginFormData, setIsLoading: (loading: boolean) => void): Promise<void> => {
    setIsLoading(true);
    
    try {
      // First try with standard Supabase authentication
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      
      if (supabaseData?.session) {
        // Check if the user has superadmin metadata or role
        const userMetadata = supabaseData.user?.user_metadata || {};
        if (userMetadata.role === 'superuser' || userMetadata.role === 'superadmin') {
          // Create a superadmin user object for context
          const superadminUser: User = {
            id: supabaseData.user.id,
            email: supabaseData.user.email || '',
            name: userMetadata.name || 'Super Admin',
            role: 'superuser' as UserRole,
            isActive: true,
            lastLogin: new Date().toISOString(),
            user_metadata: supabaseData.user.user_metadata,
            app_metadata: supabaseData.user.app_metadata,
            aud: supabaseData.user.aud,
            created_at: supabaseData.user.created_at
          };
          
          // Update auth context with superadmin user
          setCurrentUser(superadminUser);
          setSession(supabaseData.session);
          
          toast({
            title: "Access granted",
            description: "Welcome to the SuperAdmin portal",
          });
          
          navigate('/superadmin/dashboard');
          setIsLoading(false);
          return;
        } else {
          // Not a superadmin, sign out
          await supabase.auth.signOut();
        }
      }
      
      // If standard auth failed or user is not superadmin, try with custom superadmin auth
      const response = await supabase.functions.invoke('admin-utils', {
        body: {
          action: 'authenticate_superadmin',
          params: {
            userid: supabaseData?.user?.id || ''
          }
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Authentication failed');
      }
      
      const { authenticated, token, superadmin } = response.data;
      
      if (!authenticated || !token) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Invalid credentials. Please try again.",
        });
        setIsLoading(false);
        return;
      }
      
      // Store superadmin token
      localStorage.setItem('superadminToken', token);
      if (supabaseData?.session) {
        localStorage.setItem('access_token', supabaseData.session.access_token);
      }
      
      // Configure Supabase functions to use the token
      if (supabaseData?.session) {
        supabase.functions.setAuth(supabaseData.session.access_token);
      }
      
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
        isActive: true,
        lastLogin: new Date().toISOString(),
        user_metadata: mockSession.user.user_metadata
      };
      
      // Update auth context with superadmin user
      setCurrentUser(superadminUser);
      setSession(mockSession as any);
      
      toast({
        title: "Access granted",
        description: "Welcome to the SuperAdmin portal",
      });
      
      navigate('/superadmin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: error instanceof Error ? error.message : "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLogin
  };
};
