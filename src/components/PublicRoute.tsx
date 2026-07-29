
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
  const hasRecoveryTokens = params.get('access_token') && params.get('refresh_token') && params.get('type') === 'recovery';
  
  // If user is authenticated and NOT in a recovery flow, redirect to intended destination
  if (isAuthenticated && !isPasswordResetFlow && !isEmailConfirmFlow && !isRecoveryConfirm && !hasRecoveryTokens) {
    const next = params.get('next');
    const tab = params.get('tab');
    const plan = params.get('plan');

    if (next) {
      const nextParams = new URLSearchParams();
      if (tab) nextParams.set('tab', tab);
      if (plan) nextParams.set('plan', plan);
      const query = nextParams.toString();
      const target = query ? `${next}?${query}` : next;
      return <Navigate to={target} state={{ from: location }} replace />;
    }

    const lastRoute = localStorage.getItem('lastRoute');
    const safeRedirect = lastRoute && lastRoute !== '/auth/login' ? lastRoute : redirectPath;
    return <Navigate to={safeRedirect} state={{ from: location }} replace />;
  }

  // If there are children, render them, otherwise render outlet
  return <>{children ? children : <Outlet />}</>;
};

export default PublicRoute;
