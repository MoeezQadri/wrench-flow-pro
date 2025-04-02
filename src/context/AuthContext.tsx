
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getUserFromToken } from '@/services/auth-service';

interface AnalyticsConfig {
  trackingId: string;
  enabled: boolean;
  eventTracking: boolean;
  userTracking: boolean;
}

interface AuthContextValue {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  isAuthenticated: boolean;
  logout: () => void;
  analyticsConfig: AnalyticsConfig;
  updateAnalyticsConfig: (config: Partial<AnalyticsConfig>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  setCurrentUser: () => {},
  token: null,
  setToken: () => {},
  isAuthenticated: false,
  logout: () => {},
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>({
    trackingId: '',
    enabled: false,
    eventTracking: false,
    userTracking: false
  });

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      const user = getUserFromToken(storedToken);
      setCurrentUser(user);
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
    
    setLoading(false);
  }, []);
  
  // Update analytics config
  const updateAnalyticsConfig = (config: Partial<AnalyticsConfig>) => {
    setAnalyticsConfig(prev => {
      const updated = { ...prev, ...config };
      localStorage.setItem('analyticsConfig', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider 
      value={{
        currentUser,
        setCurrentUser,
        token,
        setToken,
        isAuthenticated: !!currentUser,
        logout,
        analyticsConfig,
        updateAnalyticsConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
