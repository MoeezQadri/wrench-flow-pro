
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, currentUser, isSuperAdmin } = useAuthContext();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // For superadmin routes, check if user has superadmin access
  if (location.pathname.startsWith('/superadmin')) {
    // Check if user is a superuser or has superadmin privileges
    const userIsSuperAdmin = currentUser?.user_metadata?.role === 'superuser' || isSuperAdmin;
    
    if (!userIsSuperAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // For admin routes, check appropriate permissions
  if (location.pathname.startsWith('/admin')) {
    // This would use hasPermission to check admin access in a real implementation
    const isSuperOrAdmin = currentUser?.user_metadata?.role === 'superuser' || 
                         currentUser?.user_metadata?.role === 'owner' || 
                         currentUser?.user_metadata?.role === 'manager';
    
    if (!isSuperOrAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // If there are children, render them, otherwise render the Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default PrivateRoute;
