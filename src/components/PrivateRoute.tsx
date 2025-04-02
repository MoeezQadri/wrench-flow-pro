
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, isSuperAdmin } = useAuthContext();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // For superadmin routes, check if user is a superadmin
  if (location.pathname.startsWith('/superadmin') && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // For admin routes, check if user is a superadmin or an admin
  if (location.pathname.startsWith('/admin') && !isSuperAdmin) {
    // Here you would check if user has admin permissions
    // For now, redirect non-superadmins away from admin routes
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
