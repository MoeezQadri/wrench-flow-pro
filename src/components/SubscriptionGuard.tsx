import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';

export default function SubscriptionGuard({
  children,
}: {
  children: JSX.Element;
}) {
  const { subscribed, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return null;

  // Allow Settings page no matter what
  if (location.pathname.startsWith('/settings')) {
    return children;
  }

  // If NOT subscribed → force redirect
  if (!subscribed) {
    return <Navigate to="/settings" replace />;
  }

  return children;
}
