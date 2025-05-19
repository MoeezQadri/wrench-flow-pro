
import React from 'react';
import { AuthProvider as AuthProviderComponent } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
};
