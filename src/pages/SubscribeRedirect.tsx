import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { trackSubscribePageVisitConversion } from '@/lib/analytics';

export default function SubscribeRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading } = useAuthContext();

  const plan = searchParams.get('plan') || '';

  // Fire the Google Ads "Subscribe page visit" conversion once on landing.
  const visitTracked = useRef(false);
  useEffect(() => {
    if (visitTracked.current) return;
    visitTracked.current = true;
    trackSubscribePageVisitConversion();
  }, []);

  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams();
    params.set('tab', 'subscription');
    if (plan) params.set('plan', plan);

    const settingsUrl = `/settings?${params.toString()}`;

    if (isAuthenticated) {
      navigate(settingsUrl, { replace: true });
      return;
    }

    const registerParams = new URLSearchParams();
    registerParams.set('next', '/settings');
    registerParams.set('tab', 'subscription');
    if (plan) registerParams.set('plan', plan);

    navigate(`/auth/register?${registerParams.toString()}`, { replace: true });
  }, [isAuthenticated, loading, navigate, plan]);

  return <LoadingScreen />;
}
