
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
      // Clear existing auth state first
      supabase.functions.setAuth(null);
      
      // Set the token for verification
      supabase.functions.setAuth(token);
      
      console.log("Sending verification request with token:", token.substring(0, 20) + '...');
      
      // Make the verification request
      const { data, error } = await supabase.functions.invoke('admin-utils', {
        body: { action: 'verify_token' }
      });
      
      if (error) {
        console.error("Token verification error:", error);
        localStorage.removeItem('superadminToken');
        supabase.functions.setAuth(null);
        return false;
      }
      
      if (data?.verified === true) {
        console.log("Token verification successful:", data);
        return true;
      } else {
        console.error("Invalid token response:", data);
        localStorage.removeItem('superadminToken');
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
        console.log("Found existing token, verifying...");
        const isValid = await verifyToken(superAdminToken);
        if (isValid) {
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

  const handleLogin = async (values: SuperAdminLoginFormData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear any existing tokens first
      localStorage.removeItem('superadminToken');
      supabase.functions.setAuth(null);
      
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
        return;
      }
      
      // Store the token
      localStorage.setItem('superadminToken', data.token);
      
      // Set the auth header for all subsequent Supabase function calls
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
