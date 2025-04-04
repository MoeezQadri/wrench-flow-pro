
import { User as BaseUser } from '@/types';
import { Session } from '@supabase/supabase-js';

export interface AnalyticsConfig {
  trackingId: string;
  enabled: boolean;
  eventTracking: boolean;
  userTracking: boolean;
}

export interface AuthContextValue {
  currentUser: BaseUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<BaseUser | null>>;
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  analyticsConfig: AnalyticsConfig;
  updateAnalyticsConfig: (config: Partial<AnalyticsConfig>) => void;
}

// Define the interface for the RPC function parameters
export interface UpdateLastLoginParams {
  user_id: string;
  login_time: string;
}
