
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
}

interface AuthContextType {
  currentUser: User | null;
  organization: Organization | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  session: any;
  setSession: React.Dispatch<React.SetStateAction<any>>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string, name: string, organizationName: string) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const isAuthenticated = !!currentUser;
  const isSuperAdmin = currentUser?.role === 'superuser'
    || currentUser?.role === 'superadmin'
    || currentUser?.role === 'owner';


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
      
      // Fetch organization if user has one
      if (profile?.organization_id) {
        await fetchOrganization(profile.organization_id);
      }
    } catch (error: any) {
      console.log("Error fetching user details:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganization = async (organizationId: string) => {
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        setOrganization(null);
      } else {
        setOrganization(org);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      setOrganization(null);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchUser(session.user);
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

  const signUp = async (email: string, password: string, name: string, organizationName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
          },
        },
      });

      if (error) {
        return { data: null, error };
      }

      // If user was created successfully, handle organization assignment
      if (data.user) {
        try {
          // Call our database function to handle organization creation/assignment
          const { data: orgResult, error: orgError } = await supabase.rpc(
            'create_organization_and_assign_user',
            {
              p_user_id: data.user.id,
              p_organization_name: organizationName.trim(),
              p_user_name: name,
            }
          );

          if (orgError) {
            console.error('Error with organization assignment:', orgError);
            // Still return success if user was created, organization assignment can be fixed later
          }

          // Type guard for organization result
          const orgData = orgResult as any;
          const userRole = (orgData?.role === 'admin' ? 'admin' : 'member') as UserRole;
          
          const customUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: name,
            role: userRole,
            organization_id: orgData?.organization_id || null,
            is_active: true,
            lastLogin: undefined,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at,
          };
          
          return { data: customUser, error: null };
        } catch (orgError) {
          console.error('Error handling organization:', orgError);
          // Return user anyway, organization can be assigned later
          const customUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: name,
            role: 'member' as UserRole,
            organization_id: null,
            is_active: true,
            lastLogin: undefined,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at,
          };
          return { data: customUser, error: null };
        }
      }

      return { data: null, error: null };
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
    organization,
    setCurrentUser,
    loading,
    login,
    logout,
    isAuthenticated,
    isSuperAdmin,
    session,
    setSession,
    signIn,
    signUp,
    signOut,
    refreshProfile,
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
