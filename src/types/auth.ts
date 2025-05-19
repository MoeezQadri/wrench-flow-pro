
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';

export interface AnalyticsConfig {
  trackingId: string;
  enabled: boolean;
  eventTracking: boolean;
  userTracking: boolean;
}

export interface AuthContextValue {
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
  analyticsConfig?: AnalyticsConfig;
  updateAnalyticsConfig?: (config: Partial<AnalyticsConfig>) => void;
}

// Define the interface for the RPC function parameters
export interface UpdateLastLoginParams {
  user_id: string;
  login_time: string;
}
