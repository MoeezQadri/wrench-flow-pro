import React, { createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types';

export interface Organization {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  default_tax_rate?: number;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
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
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    organizationName: string,
    redirectTo?: string
  ) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  // Subscription related
  subscribed: boolean;
  subscriptionSuspended: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  subscriptionCanceling: boolean;
  subscriptionExpiredReason: 'trial' | 'subscription' | 'suspended' | null;
  refreshSubscription: () => Promise<void>;
}

/**
 * Kept in its own module (no components here) so hot module reloads of the
 * provider never recreate the context object and detach existing consumers.
 */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
