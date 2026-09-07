import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  installNavigationGuard,
  isTrackedPath,
  setTrackingEnabled,
  trackPageView,
} from '@/lib/analytics';

/**
 * Sends a GA page_view on client-side route changes, but only on the pages
 * where tracking is allowed (login, sign-up, subscribe, payment result pages).
 * On every other page the tags are switched off so no hits are sent, even if
 * gtag.js was already loaded earlier in the session.
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isTrackedPath(location.pathname)) {
      setTrackingEnabled(false);
      return;
    }
    trackPageView(location.pathname + location.search);
    // Make sure our history guard is still the outermost wrapper before the
    // user navigates away from a tracked page.
    installNavigationGuard();
  }, [location.pathname, location.search]);

  return null;
}
