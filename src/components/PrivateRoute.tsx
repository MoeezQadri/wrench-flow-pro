
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import LoadingScreen from '@/components/LoadingScreen';

interface PrivateRouteProps {
  children?: React.ReactNode;
  requiredResource?: string;
  requiredAction?: 'view' | 'create' | 'edit' | 'delete' | 'manage';
}

const PrivateRoute = ({ children, requiredResource, requiredAction = 'view' }: PrivateRouteProps) => {
  const authContext = useAuthContext();
  const { isAuthenticated, currentUser, loading } = authContext;
  // Safe access to isSuperAdmin with fallback
  const isSuperAdmin = authContext.isSuperAdmin || false;
  const location = useLocation();

  // Save last valid route
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [isAuthenticated, location.pathname]);


  // Show loading screen while authentication state is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // For superadmin routes, check if user has superadmin access
  if (location.pathname.startsWith('/superadmin')) {
    // Check if user is a superuser or has superadmin privileges
    const userIsSuperAdmin =
      currentUser?.role === 'superuser' ||
      currentUser?.role === 'superadmin' ||
      currentUser?.role === 'owner' ||
      isSuperAdmin;

    if (!userIsSuperAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // For admin routes, check appropriate permissions
  if (location.pathname.startsWith('/admin')) {
    const isSuperOrAdmin =
      currentUser?.role === 'superuser' ||
      currentUser?.role === 'owner' ||
      currentUser?.role === 'manager';

    if (!isSuperOrAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // Check specific resource permissions if required
  if (requiredResource && !hasPermission(currentUser, requiredResource, requiredAction)) {
    return <Navigate to="/" replace />;
  }

  // Page-specific permission checks based on route
  const getRoutePermissions = (pathname: string): { resource: string; action: 'view' | 'create' | 'edit' | 'delete' | 'manage' } | null => {
    if (pathname.startsWith('/expenses')) return { resource: 'expenses', action: 'view' as const };
    if (pathname.startsWith('/settings')) return { resource: 'settings', action: 'view' as const };
    if (pathname.startsWith('/users')) return { resource: 'users', action: 'view' as const };
    if (pathname.startsWith('/mechanics')) return { resource: 'mechanics', action: 'view' as const };
    if (pathname.startsWith('/customers')) return { resource: 'customers', action: 'view' as const };
    if (pathname.startsWith('/tasks')) return { resource: 'tasks', action: 'view' as const };
    if (pathname.startsWith('/parts')) return { resource: 'parts', action: 'view' as const };
    if (pathname.startsWith('/vehicles')) return { resource: 'vehicles', action: 'view' as const };
    if (pathname.startsWith('/invoices')) return { resource: 'invoices', action: 'view' as const };
    if (pathname.startsWith('/attendance')) return { resource: 'attendance', action: 'view' as const };
    return null;
  };

  const routePermissions = getRoutePermissions(location.pathname);
  if (routePermissions && !hasPermission(currentUser, routePermissions.resource, routePermissions.action)) {
    return <Navigate to="/" replace />;
  }

  // If there are children, render them, otherwise render the Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default PrivateRoute;
