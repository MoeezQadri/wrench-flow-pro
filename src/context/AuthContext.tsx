
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { createUserFromSession, fetchUserProfile, handleEmailConfirmation, updateLastLogin } from '@/utils/auth-utils';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<any>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're coming from an email confirmation link
        const isEmailConfirmation = await handleEmailConfirmation();
        if (isEmailConfirmation) return;

        // First set up the auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setSession(session);
            
            if (session) {
              // Using setTimeout to prevent potential auth deadlocks
              setTimeout(async () => {
                const { profileData } = await fetchUserProfile(session.user.id);
                const user = createUserFromSession(session, profileData);
                setCurrentUser(user);
                
                // Check if the user is a superadmin
                const isSuperUser = user.role === 'superuser' || user.isSuperAdmin;
                setIsSuperAdmin(isSuperUser);
                
                // Update user's last login time
                await updateLastLogin(user.id);
              }, 0);
            } else {
              setCurrentUser(null);
              setIsSuperAdmin(false);
            }
          }
        );

        // Then check for an existing session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          
          // Fetch user profile data
          const { profileData } = await fetchUserProfile(initialSession.user.id);
          const user = createUserFromSession(initialSession, profileData);
          setCurrentUser(user);
          
          // Check if the user is a superadmin
          const isSuperUser = user.role === 'superuser' || user.isSuperAdmin;
          setIsSuperAdmin(isSuperUser);
          
          // Update user's last login time
          await updateLastLogin(user.id);
        }

        setLoading(false);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'owner',
            organizationId: userData.organizationId
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setCurrentUser(null);
      setSession(null);
      setIsSuperAdmin(false);
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error logging out. Please try again.');
    }
  };

  const refreshUserData = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { profileData } = await fetchUserProfile(session.user.id);
      const updatedUser = createUserFromSession(session, profileData);
      setCurrentUser(updatedUser);
      
      // Check if the user is a superadmin
      const isSuperUser = updatedUser.role === 'superuser' || updatedUser.isSuperAdmin;
      setIsSuperAdmin(isSuperUser);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        isAuthenticated: !!currentUser,
        loading,
        isSuperAdmin,
        signIn,
        signUp,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
