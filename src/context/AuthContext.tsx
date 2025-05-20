
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { AuthContextValue } from '@/types/auth';
import { User as AppUser } from '@/types';
import { toast } from 'sonner';
import { updateLastLogin } from '@/utils/auth-utils';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Check if this user is a superadmin
          const superAdminToken = localStorage.getItem('superadminToken');
          const userIsSuperAdmin = newSession.user.user_metadata?.role === 'superuser' || superAdminToken;
          setIsSuperAdmin(userIsSuperAdmin);
          
          // Create AppUser from session
          const appUser: AppUser = {
            id: newSession.user.id,
            email: newSession.user.email || '',
            name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || 'User',
            role: newSession.user.user_metadata?.role || 'owner',
            isActive: true,
            organizationId: newSession.user.user_metadata?.organizationId,
            user_metadata: newSession.user.user_metadata,
            app_metadata: newSession.user.app_metadata,
            created_at: newSession.user.created_at,
            aud: newSession.user.aud,
            lastLogin: new Date().toISOString()
          };
          
          setCurrentUser(appUser);
          
          // If this is a login event, update the last login time
          if (event === 'SIGNED_IN') {
            try {
              // Use a timeout to avoid auth deadlock
              setTimeout(async () => {
                try {
                  await updateLastLogin(newSession.user.id);
                  console.log('Updated last login timestamp');
                } catch (err) {
                  console.error('Failed to update last login:', err);
                }
              }, 0);
            } catch (err) {
              console.error('Error in login callback:', err);
            }
          }
        } else {
          setCurrentUser(null);
          setIsSuperAdmin(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        console.log('Initial session check:', existingSession?.user?.id);
        
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession?.user) {
          // Check if this user is a superadmin
          const superAdminToken = localStorage.getItem('superadminToken');
          const userIsSuperAdmin = existingSession.user.user_metadata?.role === 'superuser' || superAdminToken;
          setIsSuperAdmin(userIsSuperAdmin);
          
          // Create AppUser from session
          const appUser: AppUser = {
            id: existingSession.user.id,
            email: existingSession.user.email || '',
            name: existingSession.user.user_metadata?.name || existingSession.user.email?.split('@')[0] || 'User',
            role: existingSession.user.user_metadata?.role || 'owner',
            isActive: true,
            organizationId: existingSession.user.user_metadata?.organizationId,
            user_metadata: existingSession.user.user_metadata,
            app_metadata: existingSession.user.app_metadata,
            created_at: existingSession.user.created_at,
            aud: existingSession.user.aud,
            lastLogin: new Date().toISOString()
          };
          
          setCurrentUser(appUser);
        } else {
          setCurrentUser(null);
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      console.log('AuthProvider: Unsubscribing from auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(`Sign in error: ${error.message}`);
      }
      
      return { data: data.session, error };
    } catch (error) {
      toast.error(`Unexpected error during sign in: ${(error as Error).message}`);
      return { data: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'owner', // Default role for new signups
          },
        },
      });
      
      if (error) {
        toast.error(`Sign up error: ${error.message}`);
      }
      
      return { data: data.user, error };
    } catch (error) {
      toast.error(`Unexpected error during sign up: ${(error as Error).message}`);
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Clear any superadmin token
      localStorage.removeItem('superadminToken');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Sign out error: ${error.message}`);
      }
      return { error };
    } catch (error) {
      toast.error(`Unexpected error during sign out: ${(error as Error).message}`);
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await signOut();
    setCurrentUser(null);
    setSession(null);
    setIsSuperAdmin(false);
  };

  const verifySuperAdminToken = async (token: string): Promise<boolean> => {
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'verify-superadmin-token',
        {
          body: { token },
        }
      );
      
      if (verifyError) {
        console.error('Token verification error:', verifyError);
        return false;
      }
      
      if (verifyData?.isValid) {
        // Store the token in local storage
        localStorage.setItem('superadminToken', token);
        setIsSuperAdmin(true);
        
        // Update the current user with superadmin info if available
        if (currentUser && verifyData.username) {
          setCurrentUser({
            ...currentUser,
            role: 'superuser',
            name: verifyData.username || currentUser.name,
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying superadmin token:', error);
      return false;
    }
  };

  const value: AuthContextValue = {
    currentUser,
    session,
    isAuthenticated: !!currentUser,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    logout,
    setSession,
    setCurrentUser,
    verifySuperAdminToken,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Export AuthContext for direct access
export { AuthContext };
