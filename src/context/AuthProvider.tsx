
import React, { useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextValue, AnalyticsConfig } from '@/types/auth';
import { createContext } from 'react';
import {
  handleEmailConfirmation,
  createUserFromSession,
  updateLastLogin,
  fetchUserProfile
} from '@/utils/auth-utils';

// Create the context here since we're not importing it
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
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
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (newSession?.user) {
          // Check for existing profile data in Supabase
          try {
            const { profileData } = await fetchUserProfile(newSession.user.id);
            
            // Create user object from session and profile data
            const user = createUserFromSession(newSession, profileData);
            
            // Update the last login time if the profile exists
            if (profileData) {
              await updateLastLogin(newSession.user.id);
            }
            
            setCurrentUser(user);
          } catch (error) {
            console.error('Error in auth state change:', error);
            // Fallback to basic user info
            const user = createUserFromSession(newSession);
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
          const { profileData } = await fetchUserProfile(initialSession.user.id);
          
          const lastLoginTime = profileData?.lastLogin || new Date().toISOString();
          
          // Create user object from session and profile data
          const user = createUserFromSession(initialSession, profileData);
          
          // Update the last login time if the profile exists
          if (profileData) {
            await updateLastLogin(initialSession.user.id);
          }
          
          setCurrentUser(user);
        } catch (error) {
          console.error('Error in get session:', error);
          // Fallback to basic user info
          const user = createUserFromSession(initialSession);
          setCurrentUser(user);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
    
    // Check for stored superadmin session
    const storedSuperadminToken = localStorage.getItem('superadminToken');
    if (storedSuperadminToken && !session) {
      try {
        // Create a properly formatted mock Session object for the superadmin
        const superadminSession: Session = {
          access_token: storedSuperadminToken,
          refresh_token: '',
          token_type: 'bearer', // Add the required token_type property
          expires_at: Date.now() + 3600000, // 1 hour from now
          expires_in: 3600,
          user: {
            id: 'superadmin-id',
            email: 'superadmin@example.com',
            app_metadata: {},
            user_metadata: {
              name: 'Super Admin',
              role: 'superuser'
            },
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        };
        
        setSession(superadminSession);
        setCurrentUser({
          id: superadminSession.user.id,
          email: superadminSession.user.email || '',
          name: superadminSession.user.user_metadata?.name || '',
          role: 'superuser',
          isActive: true,
          lastLogin: new Date().toISOString(),
          user_metadata: superadminSession.user.user_metadata,
          app_metadata: superadminSession.user.app_metadata,
          aud: superadminSession.user.aud,
          created_at: superadminSession.user.created_at
        });
      } catch (error) {
        console.error('Failed to parse superadmin session:', error);
        localStorage.removeItem('superadminToken');
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
      localStorage.removeItem('superadminToken');
      setCurrentUser(null);
      setSession(null);
    } else {
      // Regular Supabase logout
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
    }
  };

  const isSuperAdmin = currentUser?.role === 'superuser' || currentUser?.user_metadata?.role === 'superuser';

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

// Export the context hook for usage in other components
export { AuthContext };
