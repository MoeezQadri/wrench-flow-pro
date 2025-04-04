
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { useTokenVerification } from './useTokenVerification';

export const useSessionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentUser, setSession } = useAuthContext();
  const { verifyToken } = useTokenVerification();

  const checkExistingSession = async (): Promise<boolean> => {
    const superAdminToken = localStorage.getItem('superadminToken');
    if (superAdminToken) {
      try {
        console.log("Found existing token, verifying...");
        const isValid = await verifyToken(superAdminToken);
        if (isValid) {
          // Set the auth token for future API calls
          supabase.functions.setAuth(superAdminToken);
          
          // Create a superadmin user object for context
          const superadminUser = {
            id: 'superadmin-id',
            email: 'superadmin@admin.system',
            name: 'Super Admin',
            role: 'superuser' as UserRole,
            isActive: true,
            lastLogin: new Date().toISOString()
          };
          
          // Update auth context with superadmin user
          setCurrentUser(superadminUser);
          setSession({
            access_token: superAdminToken,
            refresh_token: '',
            token_type: 'bearer',
            expires_at: Date.now() + 86400000, // 24 hours from now
            expires_in: 86400,
            user: {
              id: 'superadmin-id',
              email: 'superadmin@admin.system',
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

  return {
    isLoading,
    setIsLoading,
    checkExistingSession
  };
};
