import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ensureAnalytics,
  isTrackedPath,
  restoreNativeHistory,
  setAnalyticsEnabled,
  trackAdsPageView,
  trackPageView,
} from '@/lib/analytics';

/**
 * The Google Ads tag reports every page. Google Analytics only reports the
 * allowed pages (login, sign-up, subscribe, payment result pages); everywhere
 * else GA is switched off so no hit is sent.
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    ensureAnalytics();
    trackAdsPageView(path);

    if (!isTrackedPath(location.pathname)) {
      setAnalyticsEnabled(false);
    } else {
      trackPageView(path);
    }
    // gtag re-hooks the history API as it initializes; unhook again so leaving
    // this page does not report the next one automatically.
    restoreNativeHistory();
  }, [location.pathname, location.search]);

  return null;
}

