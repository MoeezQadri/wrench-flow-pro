
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLoginFormData } from '@/components/superadmin/SuperAdminLoginForm';

export const useAuthentication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCurrentUser, setSession } = useAuthContext();

  const handleLogin = async (values: SuperAdminLoginFormData, setIsLoading: (loading: boolean) => void): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Authenticate directly with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.username + '@superadmin.system', // Convert username to email format
        password: values.password
      });
      
      if (error) {
        console.error('Authentication error:', error);
        toast({
          variant: "destructive",
          title: "Access denied",
          description: error.message || "Invalid username or password. Please try again.",
        });
        setIsLoading(false);
        return;
      }
      
      if (!data.session) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "No session created. Please try again.",
        });
        setIsLoading(false);
        return;
      }
      
      // Check if the user has superadmin metadata or role
      const userMetadata = data.user?.user_metadata || {};
      if (userMetadata.role !== 'superuser' && userMetadata.role !== 'superadmin') {
        // If not superadmin, sign out and show error
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You do not have superadmin privileges.",
        });
        setIsLoading(false);
        return;
      }
      
      // Create a superadmin user object for context
      const superadminUser = {
        id: data.user.id,
        email: data.user.email || `${values.username}@superadmin.system`,
        name: userMetadata.name || 'Super Admin',
        role: 'superuser' as UserRole,
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      // Update auth context with superadmin user
      setCurrentUser(superadminUser);
      setSession(data.session);
      
      toast({
        title: "Access granted",
        description: "Welcome to the SuperAdmin portal",
      });
      
      console.log("Authentication successful, redirecting to dashboard");
      
      // Redirect to the dashboard
      navigate('/superadmin/dashboard');
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
    handleLogin
  };
};
