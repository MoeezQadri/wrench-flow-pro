
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

  // If user is a superadmin but trying to access regular app routes
  // redirect them to the superadmin dashboard
  if (isSuperAdmin && !location.pathname.startsWith('/superadmin')) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
