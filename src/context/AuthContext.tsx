
import React, { createContext, useContext } from 'react';
import { AuthProvider } from './AuthProvider';
import { AuthContextValue } from '@/types/auth';

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

export { AuthContext, AuthProvider };
