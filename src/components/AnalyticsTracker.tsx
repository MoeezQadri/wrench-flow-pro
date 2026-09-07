import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  isTrackedPath,
  restoreNativeHistory,
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
    // gtag re-hooks the history API as it initializes; unhook again so leaving
    // this page does not report the next one.
    restoreNativeHistory();
  }, [location.pathname, location.search]);

  return null;
}
