
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  session: any;
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
    const getSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        await fetchUser(session.user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    };

    getSession();

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });
  }, []);

  const fetchUser = async (user: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

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
        lastLogin: profile?.last_login || null,
        created_at: profile?.created_at || null,
        updated_at: profile?.updated_at || null,
      };

      setCurrentUser(userDetails);
    } catch (error: any) {
      console.error("Error fetching user details:", error.message);
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

  const value: AuthContextType = {
    currentUser,
    setCurrentUser,
    loading,
    login,
    logout,
    isAuthenticated,
    isSuperAdmin,
    session,
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
