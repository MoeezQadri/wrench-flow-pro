import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isTrackedPath, trackPageView } from '@/lib/analytics';

/**
 * Sends a GA page_view on client-side route changes, but only on the pages
 * where tracking is allowed (login, sign-up, subscribe, payment result pages).
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isTrackedPath(location.pathname)) return;
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}
