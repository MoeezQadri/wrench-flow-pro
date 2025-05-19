
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole, User } from '@/types';

export const useSessionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentUser, setSession } = useAuthContext();

  const checkExistingSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Checking existing session");
      
      // First check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if the user has superadmin role in metadata
        const userMetadata = session.user?.user_metadata || {};
        
        if (userMetadata.role === 'superuser' || userMetadata.role === 'superadmin') {
          // Create a superadmin user object for context
          const superadminUser: User = {
            id: session.user.id,
            email: session.user.email || 'superadmin@admin.system',
            name: userMetadata.name || 'Super Admin',
            role: 'superuser' as UserRole,
            isActive: true,
            lastLogin: new Date().toISOString(),
            user_metadata: session.user.user_metadata,
            app_metadata: session.user.app_metadata,
            aud: session.user.aud,
            created_at: session.user.created_at
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
        }
      }
      
      // Also check for stored superadmin token
      const superadminToken = localStorage.getItem('superadminToken');
      if (superadminToken) {
        // Verify the token with backend - Fix: Use the correct way to invoke edge functions
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-utils`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${superadminToken}`
          },
          body: JSON.stringify({
            action: 'verify_token'
          })
        });
        
        const result = await response.json();
        
        if (result.verified) {
          // Create a mock session object for the superadmin
          const mockSession = {
            access_token: superadminToken,
            refresh_token: '',
            expires_at: Date.now() + 3600000, // 1 hour from now
            user: {
              id: 'superadmin',
              email: 'superadmin@system.local',
              user_metadata: {
                name: 'Super Admin',
                role: 'superuser'
              }
            }
          };
          
          // Create a superadmin user object for context
          const superadminUser: User = {
            id: 'superadmin',
            email: 'superadmin@system.local',
            name: 'Super Admin',
            role: 'superuser' as UserRole,
            isActive: true,
            lastLogin: new Date().toISOString(),
            user_metadata: mockSession.user.user_metadata,
          };
          
          // Update auth context with superadmin user
          setCurrentUser(superadminUser);
          setSession(mockSession as any);
          
          toast({
            title: "Session restored",
            description: "Welcome back, SuperAdmin",
          });
          
          navigate('/superadmin/dashboard');
          return true;
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('superadminToken');
        }
      }
      
      return false;
    } catch (err) {
      console.error("Error checking existing session:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    setIsLoading,
    checkExistingSession
  };
};
