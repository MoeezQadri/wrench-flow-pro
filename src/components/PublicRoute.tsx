
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';

interface PublicRouteProps {
  children?: React.ReactNode;
  redirectPath?: string;
}

const PublicRoute = ({ children, redirectPath = '/' }: PublicRouteProps) => {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Allow password reset and email confirmation flows even if authenticated
  const params = new URLSearchParams(location.search);
  const isPasswordResetFlow = location.pathname === '/auth/reset-password';
  const isEmailConfirmFlow = location.pathname === '/auth/confirm';
  const isRecoveryConfirm = location.pathname === '/auth/confirm' && params.get('type') === 'recovery';
  
  // If user is authenticated and NOT in a recovery flow, redirect to dashboard
  if (isAuthenticated && !isPasswordResetFlow && !isEmailConfirmFlow && !isRecoveryConfirm) {
    const lastRoute = localStorage.getItem('lastRoute');
    const safeRedirect = lastRoute && lastRoute !== '/auth/login' ? lastRoute : redirectPath;
    return <Navigate to={safeRedirect} state={{ from: location }} replace />;
  }

  // If there are children, render them, otherwise render outlet
  return <>{children ? children : <Outlet />}</>;
};

export default PublicRoute;
