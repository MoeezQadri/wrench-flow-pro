
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  currency?: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  currentUser: User | null;
  user: User | null;
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
  // Subscription related
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  refreshSubscription: () => Promise<void>;
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
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loadingStartTime] = useState<number>(Date.now());
  
  // Subscription state
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const isAuthenticated = !!currentUser;
  const isSuperAdmin = currentUser?.role === 'superuser'
    || currentUser?.role === 'superadmin'
    || currentUser?.role === 'owner';

  // Loading timeout management
  useEffect(() => {
    if (loading) {
      console.log('[AuthContext] Starting loading timeout...');
      
      const timeout = setTimeout(() => {
        const duration = Date.now() - loadingStartTime;
        console.warn('[AuthContext] Loading timeout reached after', duration, 'ms - forcing completion');
        setLoading(false);
      }, 30000); // 30 second timeout
      
      setLoadingTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    } else {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    }
  }, [loading, loadingTimeout, loadingStartTime]);

  useEffect(() => {
    let isInitialized = false;
    
    console.log('[AuthContext] Initializing auth state listener...');
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
      
      // Synchronous state updates only
      setSession(session);
      
      if (session?.user) {
        // Defer async operations to prevent deadlock
        setTimeout(() => {
          fetchUser(session.user);
        }, 0);
      } else {
        // Clear user state immediately
        setCurrentUser(null);
        setOrganization(null);
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
      }
      
      if (isInitialized) {
        setLoading(false);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', { hasSession: !!session, userId: session?.user?.id });
      
      if (session?.user) {
        fetchUser(session.user);
      } else {
        setLoading(false);
      }
      
      isInitialized = true;
    });

    return () => {
      console.log('[AuthContext] Cleaning up auth listener...');
      listener?.subscription?.unsubscribe();
    };
  }, []);


  const fetchUser = async (user: SupabaseUser) => {
    try {
      console.log('[AuthContext] Fetching user profile for:', user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

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
      console.log('[AuthContext] User profile loaded:', { userId: userDetails.id, role: userDetails.role });
      
      // Fetch organization and subscription
      if (profile?.organization_id) {
        await fetchOrganization(profile.organization_id);
        checkSubscriptionStatus();
      }
      
      // Loading complete
      setLoading(false);
      console.log('[AuthContext] Loading complete after user fetch');
    } catch (error: any) {
      console.error("Error fetching user details:", error.message);
      setCurrentUser(null);
      setLoading(false);
      console.log('[AuthContext] Loading complete after error');
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

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      setSubscribed(data.subscribed || false);
      setSubscriptionTier(data.subscription_tier || null);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    }
  };

  const refreshSubscription = async () => {
    await checkSubscriptionStatus();
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
      console.log('[AuthContext] Logging out user...');
      
      // Clear state immediately
      setCurrentUser(null);
      setSession(null);
      setOrganization(null);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('[AuthContext] Logout completed');
    } catch (error: any) {
      console.error("Logout error:", error.message);
      // Even if signOut fails, we've cleared local state
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting sign in for:', email);
      
      // Clear any existing session state first
      setCurrentUser(null);
      setSession(null);
      setOrganization(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        return { data: null, error };
      }

      console.log('[AuthContext] Sign in successful:', { hasSession: !!data.session, userId: data.session?.user?.id });
      return { data: data.session, error: null };
    } catch (error) {
      console.error('[AuthContext] Sign in exception:', error);
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
            return { data: null, error: new Error('Failed to process organization assignment') };
          }

          // Type guard for organization result
          const orgData = orgResult as any;
          
          // Handle specific error cases from database function
          if (orgData?.success === false) {
            if (orgData?.error === 'organization_exists') {
              return { data: null, error: new Error(orgData.message) };
            } else if (orgData?.error === 'user_exists_in_organization') {
              const message = `This email is already registered with "${orgData.existing_organization}". Each user can only belong to one organization at a time.`;
              return { data: null, error: new Error(message) };
            } else {
              return { data: null, error: new Error(orgData.message || 'Failed to create organization') };
            }
          }
          
          if (!orgData?.success) {
            return { data: null, error: new Error('Failed to create organization') };
          }
          
          const userRole = (orgData?.role === 'owner' ? 'owner' : orgData?.role === 'admin' ? 'admin' : 'member') as UserRole;
          
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
          return { data: null, error: new Error('Failed to process signup') };
        }
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Sign out requested...');
      
      // Clear state first
      setCurrentUser(null);
      setSession(null);
      setOrganization(null);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      
      const { error } = await supabase.auth.signOut();
      console.log('[AuthContext] Sign out completed:', { error });
      return { error };
    } catch (error) {
      console.error('[AuthContext] Sign out exception:', error);
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    currentUser,
    user: currentUser, // Add alias for user property
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
    subscribed,
    subscriptionTier,
    subscriptionEnd,
    refreshSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
