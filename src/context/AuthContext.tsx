
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { AuthContextValue } from '@/types/auth';
import { User as AppUser } from '@/types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            role: session.user.user_metadata?.role,
            isActive: true,
            organizationId: session.user.user_metadata?.organizationId,
            user_metadata: session.user.user_metadata,
            app_metadata: session.user.app_metadata,
            created_at: session.user.created_at,
            aud: session.user.aud,
            lastLogin: new Date().toISOString()
          };
          setCurrentUser(appUser);
        } else {
          setCurrentUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          role: session.user.user_metadata?.role,
          isActive: true,
          organizationId: session.user.user_metadata?.organizationId,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata,
          created_at: session.user.created_at,
          aud: session.user.aud,
          lastLogin: new Date().toISOString()
        };
        setCurrentUser(appUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { data: data.session, error };
    } catch (error) {
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
          },
        },
      });
      
      return { data: data.user, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await signOut();
    setCurrentUser(null);
    setSession(null);
  };

  const isSuperAdmin = currentUser?.role === 'superuser' || currentUser?.user_metadata?.role === 'superuser';

  const value: AuthContextValue = {
    currentUser,
    session,
    loading,
    isAuthenticated: !!currentUser,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    logout,
    setSession,
    setCurrentUser
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
