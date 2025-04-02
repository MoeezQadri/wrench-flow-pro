
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, currentUser } = useAuthContext();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // For superadmin routes, check if user has superadmin access
  if (location.pathname.startsWith('/superadmin')) {
    // Check if user is a superuser or has superadmin privileges
    const isSuperAdmin = currentUser?.role === 'superuser' || (currentUser as any)?.isSuperAdmin;
    
    if (!isSuperAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // For admin routes, check appropriate permissions
  if (location.pathname.startsWith('/admin')) {
    // This would use hasPermission to check admin access in a real implementation
    const isSuperOrAdmin = currentUser?.role === 'superuser' || currentUser?.role === 'owner' || currentUser?.role === 'manager';
    
    if (!isSuperOrAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
