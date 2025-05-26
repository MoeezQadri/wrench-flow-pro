import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { fetchUserProfile, updateLastLogin, createUserFromSession } from '@/utils/auth-utils';

interface AuthContextValue {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  signIn?: (email: string, password: string) => Promise<{data: any, error: Error | null}>;
  signUp?: (email: string, password: string, name: string) => Promise<{data: any, error: Error | null}>;
  signOut?: () => Promise<{error: Error | null}>;
  verifySuperAdminToken?: (token: string) => Promise<boolean>;
  loading: boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  setCurrentUser: () => {},
  session: null,
  setSession: () => {},
  isAuthenticated: false,
  isSuperAdmin: false,
  logout: async () => {},
  loading: true,
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!session && !!currentUser;
  const isSuperAdmin = currentUser?.role === 'superuser' || !!currentUser?.isSuperAdmin;

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Fetch or create user profile
          const { profileData } = await fetchUserProfile(session.user.id);
          const user = createUserFromSession(session, profileData);
          
          // Check if user is superadmin
          if (user.role === 'superuser') {
            user.isSuperAdmin = true;
          }
          
          setCurrentUser(user);
          
          // Update last login
          setTimeout(() => {
            updateLastLogin(session.user.id);
          }, 0);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Will be handled by the auth state change listener above
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    setCurrentUser(null);
    setSession(null);
  };

  const value: AuthContextValue = {
    currentUser,
    setCurrentUser,
    session,
    setSession,
    isAuthenticated,
    isSuperAdmin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextValue };
