
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

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    const lastRoute = localStorage.getItem('lastRoute');
    const safeRedirect = lastRoute && lastRoute !== '/auth/login' ? lastRoute : redirectPath;
    return <Navigate to={safeRedirect} state={{ from: location }} replace />;
  }

  // If there are children, render them, otherwise render outlet
  return <>{children ? children : <Outlet />}</>;
};

export default PublicRoute;
