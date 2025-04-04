
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsConfig {
  trackingId: string;
  enabled: boolean;
  eventTracking: boolean;
  userTracking: boolean;
}

interface AuthContextValue {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  analyticsConfig: AnalyticsConfig;
  updateAnalyticsConfig: (config: Partial<AnalyticsConfig>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  setCurrentUser: () => {},
  session: null,
  setSession: () => {},
  isAuthenticated: false,
  isSuperAdmin: false,
  logout: async () => {},
  analyticsConfig: {
    trackingId: '',
    enabled: false,
    eventTracking: false,
    userTracking: false
  },
  updateAnalyticsConfig: () => {},
});

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Define the interface for the RPC function parameters
interface UpdateLastLoginParams {
  user_id: string;
  login_time: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>({
    trackingId: '',
    enabled: false,
    eventTracking: false,
    userTracking: false
  });

  useEffect(() => {
    // Check for email confirmation redirects
    const handleEmailConfirmation = async () => {
      const url = window.location.href;
      if (url.includes('#access_token=') && url.includes('type=signup')) {
        // User has confirmed their email - redirect to login
        window.location.href = '/auth/login';
        return true;
      }
      return false;
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (newSession?.user) {
          // Check for existing profile data in Supabase
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
            }
            
            // Create user object from session and profile data
            const user: User = {
              id: newSession.user.id,
              email: newSession.user.email || '',
              name: profileData?.name || newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || '',
              role: profileData?.role || newSession.user.user_metadata?.role || 'owner',
              isActive: profileData?.is_active ?? true,
              organizationId: profileData?.organization_id || newSession.user.user_metadata?.organization_id || undefined,
              lastLogin: new Date().toISOString()
            };
            
            // Update the last login time if the profile exists
            if (profileData) {
              // Fix: Use the correct typing for RPC calls by providing a record type instead of individual parameters
              const { error } = await supabase.rpc<any>('update_last_login', {
                user_id: newSession.user.id,
                login_time: new Date().toISOString()
              } as UpdateLastLoginParams);
              
              if (error) {
                console.error('Error updating last login:', error);
              }
            }
            
            setCurrentUser(user);
          } catch (error) {
            console.error('Error in auth state change:', error);
            // Fallback to basic user info
            const user: User = {
              id: newSession.user.id,
              email: newSession.user.email || '',
              name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || '',
              role: newSession.user.user_metadata?.role || 'owner',
              isActive: true,
              organizationId: newSession.user.user_metadata?.organization_id || undefined,
              lastLogin: new Date().toISOString()
            };
            setCurrentUser(user);
          }
        } else {
          setCurrentUser(null);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      // First check if this is an email confirmation redirect
      const isEmailConfirmation = await handleEmailConfirmation();
      if (isEmailConfirmation) {
        // Skip the rest of the initialization if redirecting
        return;
      }
      
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      
      if (initialSession?.user) {
        try {
          // Get profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }
          
          const lastLoginTime = profileData?.lastLogin || new Date().toISOString();
          
          // Create user object from session and profile data
          const user: User = {
            id: initialSession.user.id,
            email: initialSession.user.email || '',
            name: profileData?.name || initialSession.user.user_metadata?.name || initialSession.user.email?.split('@')[0] || '',
            role: profileData?.role || initialSession.user.user_metadata?.role || 'owner',
            isActive: profileData?.is_active ?? true,
            organizationId: profileData?.organization_id || initialSession.user.user_metadata?.organization_id || undefined,
            lastLogin: lastLoginTime
          };
          
          // Update the last login time if the profile exists
          if (profileData) {
            // Fix: Use the correct typing for RPC calls by providing a record type instead of individual parameters
            const { error } = await supabase.rpc<any>('update_last_login', {
              user_id: initialSession.user.id,
              login_time: new Date().toISOString()
            } as UpdateLastLoginParams);
            
            if (error) {
              console.error('Error updating last login:', error);
            }
          }
          
          setCurrentUser(user);
        } catch (error) {
          console.error('Error in get session:', error);
          // Fallback to basic user info
          const user: User = {
            id: initialSession.user.id,
            email: initialSession.user.email || '',
            name: initialSession.user.user_metadata?.name || initialSession.user.email?.split('@')[0] || '',
            role: initialSession.user.user_metadata?.role || 'owner',
            isActive: true,
            organizationId: initialSession.user.user_metadata?.organization_id || undefined,
            lastLogin: new Date().toISOString()
          };
          setCurrentUser(user);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
    
    // Check for stored superadmin session
    const storedSuperadminSession = localStorage.getItem('superadminSession');
    if (storedSuperadminSession && !session) {
      try {
        const parsedSession = JSON.parse(storedSuperadminSession) as Session;
        if (parsedSession.user?.user_metadata?.role === 'superuser') {
          setSession(parsedSession);
          setCurrentUser({
            id: parsedSession.user.id,
            email: parsedSession.user.email || '',
            name: parsedSession.user.user_metadata?.name || '',
            role: 'superuser',
            isActive: true,
            lastLogin: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Failed to parse superadmin session:', error);
        localStorage.removeItem('superadminSession');
      }
    }
    
    // Check for stored analytics config
    const storedAnalyticsConfig = localStorage.getItem('analyticsConfig');
    if (storedAnalyticsConfig) {
      try {
        setAnalyticsConfig(JSON.parse(storedAnalyticsConfig));
      } catch (error) {
        console.error('Failed to parse analytics config:', error);
      }
    }
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Update analytics config
  const updateAnalyticsConfig = (config: Partial<AnalyticsConfig>) => {
    setAnalyticsConfig(prev => {
      const updated = { ...prev, ...config };
      localStorage.setItem('analyticsConfig', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    // Check if it's a superadmin session
    if (currentUser?.role === 'superuser' && session?.access_token?.startsWith('superadmin-')) {
      localStorage.removeItem('superadminSession');
      setCurrentUser(null);
      setSession(null);
    } else {
      // Regular Supabase logout
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
    }
  };

  const isSuperAdmin = currentUser?.role === 'superuser';

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider 
      value={{
        currentUser,
        setCurrentUser,
        session,
        setSession,
        isAuthenticated: !!currentUser,
        isSuperAdmin,
        logout,
        analyticsConfig,
        updateAnalyticsConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
