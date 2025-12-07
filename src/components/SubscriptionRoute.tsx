import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';

export default function SubscriptionRoute() {
  const { subscribed, loading, isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Loading state
  if (loading) return null;

  // Must be logged in or redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Always allow access to /settings whether subscribed or not
  if (location.pathname.startsWith('/settings')) {
    return <Outlet />;
  }

  // If not subscribed, restrict to only /settings route
  if (!subscribed) {
    console.warn('[SubscriptionGuard] Blocked access:', location.pathname);
    return <Navigate to="/settings" replace />;
  }

  // All good — allow access
  return <Outlet />;
}
