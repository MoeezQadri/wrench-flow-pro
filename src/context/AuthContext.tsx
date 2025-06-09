
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  session: any;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string, name: string) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const isAuthenticated = !!currentUser;
  const isSuperAdmin = currentUser?.role === 'superuser';

  useEffect(() => {
    setLoading(true);
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session) {
        await fetchUser(session.user);
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    // Initial session fetch fallback (safe-guard)
    // supabase.auth.getSession()
    //   .then(({ data }) => {
    //     if (data.session) {
    //       setSession(data.session);
    //       fetchUser(data.session.user).then(() => setLoading(false));
    //     } else {
    //       setCurrentUser(null);
    //       setLoading(false);
    //     }
    //   })
    //   .catch((err) => {
    //     console.error('Error getting session:', err);
    //     setCurrentUser(null);
    //     setLoading(false);
    //   });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);


  const fetchUser = async (user: SupabaseUser) => {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch user timed out')), 5000)
      );
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Race query against timeout:
      const { data: profile, error } = await Promise.race([query, timeout]) as any;
      if (error) {
        throw error;
      }

      const userRole = (profile?.role || 'viewer') as UserRole;

      const userDetails: User = {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email?.split('@')[0] || 'User',
        role: userRole,
        organization_id: profile?.organization_id || null,
        is_active: profile?.is_active || true,
        lastLogin: profile?.lastLogin || null,
        created_at: profile?.created_at || null,
        updated_at: profile?.updated_at || null,
      };

      setCurrentUser(userDetails);
    } catch (error: any) {
      console.log("Error fetching user details:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
    } catch (error: any) {
      console.error("Login error:", error.message);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
    } catch (error: any) {
      console.error("Logout error:", error.message);
    }
  };

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

  const value: AuthContextType = {
    currentUser,
    setCurrentUser,
    loading,
    login,
    logout,
    isAuthenticated,
    isSuperAdmin,
    session,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export type { AuthContextType };
export { AuthProvider, useAuthContext };
