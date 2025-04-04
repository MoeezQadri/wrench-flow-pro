
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

export const useSessionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentUser, setSession } = useAuthContext();

  const checkExistingSession = async (): Promise<boolean> => {
    try {
      console.log("Checking existing session");
      
      // Get existing session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No existing session found");
        return false;
      }
      
      // Check if the user has superadmin role
      const userMetadata = session.user?.user_metadata || {};
      if (userMetadata.role !== 'superuser' && userMetadata.role !== 'superadmin') {
        console.log("User does not have superadmin privileges");
        return false;
      }
      
      // Create a superadmin user object for context
      const superadminUser = {
        id: session.user.id,
        email: session.user.email || 'superadmin@admin.system',
        name: userMetadata.name || 'Super Admin',
        role: 'superuser' as UserRole,
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      // Update auth context with superadmin user
      setCurrentUser(superadminUser);
      setSession(session);
      
      toast({
        title: "Session restored",
        description: "Welcome back, SuperAdmin",
      });
      
      navigate('/superadmin/dashboard');
      return true;
    } catch (err) {
      console.error("Error checking existing session:", err);
      return false;
    }
  };

  return {
    isLoading,
    setIsLoading,
    checkExistingSession
  };
};
