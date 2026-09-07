const MEASUREMENT_ID = import.meta.env
  .VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined;

// Google Ads measurement ID. gtag.js supports multiple IDs through a single
// library instance, so we register this alongside the GA4 config rather than
// loading a second gtag script.
const GOOGLE_ADS_ID = 'AW-18425240978';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let initialized = false;

// gtag.js only treats a pushed item as a command when it is the `arguments`
// object — pushing a real Array is silently ignored.
function pushCommand() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments);
}

export function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  (pushCommand as (...a: unknown[]) => void)(...args);
}

/**
 * Paths where tracking is allowed. Everywhere else in the app no tag is loaded
 * and no page view is reported.
 */
export const TRACKED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/subscribe',
  '/payment/success',
  '/payment/canceled',
] as const;

/** Areas that must never report anything, regardless of the tracked list. */
export const BLOCKED_PATH_PREFIXES = ['/superadmin'] as const;

export function isBlockedPath(pathname: string) {
  return BLOCKED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

const OPT_OUT_KEY = 'ga-optout';

/** True when this browser session has been marked as internal (super admin). */
export function isOptedOut() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Marks the whole browser session as not-to-be-tracked (super admin). */
export function setAnalyticsOptOut(optOut = true) {
  if (typeof window === 'undefined') return;
  try {
    if (optOut) window.sessionStorage.setItem(OPT_OUT_KEY, '1');
    else window.sessionStorage.removeItem(OPT_OUT_KEY);
  } catch {
    /* ignore storage failures */
  }
  if (optOut) setTrackingEnabled(false);
}

function trackingSuppressed() {
  if (typeof window === 'undefined') return true;
  return isOptedOut() || isBlockedPath(window.location.pathname);
}

export function isTrackedPath(pathname: string) {
  if (isBlockedPath(pathname) || isOptedOut()) return false;
  return TRACKED_PATHS.some(
    (p) => pathname === p || pathname === `${p}/`
  );
}


/**
 * Once gtag.js is loaded (on a tracked page) it stays in memory for the rest of
 * the single-page session, and GA4 "enhanced measurement" keeps sending
 * page_view hits on every route change. These kill switches stop all hits for
 * both tags while the user is on a non-tracked page.
 */
export function setTrackingEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as Record<string, boolean>;
  if (MEASUREMENT_ID) w[`ga-disable-${MEASUREMENT_ID}`] = !enabled;
  w[`ga-disable-${GOOGLE_ADS_ID}`] = !enabled;
}

/**
 * gtag.js reacts to address changes immediately (before React renders the new
 * page), so switching the tags off from a route effect is too late — the first
 * in-app page after sign-in still gets reported. This wraps the history API and
 * flips the kill switch synchronously, before gtag's own listeners run.
 */
// Captured before gtag.js loads: gtag wraps these to send a page view on every
// address change (the Google Ads tag ignores the disable flag, so unhooking is
// the only reliable way to stop it). We send page views ourselves, so the
// pristine functions are all the app needs.
const nativePushState =
  typeof window !== 'undefined' ? window.history.pushState : undefined;
const nativeReplaceState =
  typeof window !== 'undefined' ? window.history.replaceState : undefined;

/**
 * Removes gtag's history hooks so no automatic page view is sent when the user
 * moves around the app. Safe to call repeatedly — gtag re-hooks while it boots.
 */
export function restoreNativeHistory() {
  if (typeof window === 'undefined' || !nativePushState || !nativeReplaceState)
    return;
  if (window.history.pushState !== nativePushState) {
    window.history.pushState = nativePushState;
  }
  if (window.history.replaceState !== nativeReplaceState) {
    window.history.replaceState = nativeReplaceState;
  }
}

/**
 * Loads gtag.js once and configures GA4 + Google Ads. Safe to call repeatedly.
 */
export function ensureAnalytics() {
  if (trackingSuppressed()) {
    setTrackingEnabled(false);
    return;
  }
  setTrackingEnabled(true);
  if (initialized || typeof window === 'undefined') return;
  if (!MEASUREMENT_ID) {
    console.warn('[analytics] Google Analytics measurement ID not configured');
    return;
  }
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  // AnalyticsTracker sends the page views itself, so disable automatic ones.
  gtag('config', MEASUREMENT_ID, { send_page_view: false });
  gtag('config', GOOGLE_ADS_ID, { send_page_view: false });

  // Install after gtag.js has wrapped the history API so our wrapper sits
  // outside its own and runs first.
  // gtag.js hooks the history API while it boots; unhook it (repeatedly, since
  // it re-hooks) so route changes inside the app are never reported.
  script.addEventListener('load', restoreNativeHistory);
  [0, 200, 600, 1500, 3000].forEach((delay) =>
    window.setTimeout(restoreNativeHistory, delay)
  );
}

export function trackPageView(path: string) {
  if (!MEASUREMENT_ID) return;
  if (trackingSuppressed() || isBlockedPath(path)) return;
  ensureAnalytics();
  gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * Puts the kill switch back after an explicit event was sent from a page where
 * automatic tracking is not allowed (e.g. the Subscription tab in Settings).
 */
function restoreKillSwitch() {
  if (typeof window === 'undefined') return;
  if (isOptedOut()) {
    setTrackingEnabled(false);
    return;
  }
  if (isTrackedPath(window.location.pathname)) return;
  window.setTimeout(() => {
    if (!isTrackedPath(window.location.pathname)) setTrackingEnabled(false);
  }, 1500);
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!MEASUREMENT_ID) return;
  if (trackingSuppressed()) return;
  ensureAnalytics();
  gtag('event', name, params);
  restoreKillSwitch();
}


/**
 * Conversion action labels from the Google Ads account. Paste the value that
 * appears after the slash in the Ads snippet, e.g. for
 * send_to: 'AW-18425240978/AbC-D_efG-h12_34-N' the label is 'AbC-D_efG-h12_34-N'.
 */
export const ADS_CONVERSION_LABELS = {
  // "Subscribe" conversion action — fires on the payment thank-you page.
  subscribe: 'dXTwCMCDru4cEJK769FE',
  // "Subscribe page visit" — fires when a visitor lands on /subscribe.
  subscribePageVisit: '_W9eCI7up-4cEJK769FE',
  // "Signup / Register" — fires when a visitor completes registration.
  signup: 'ep72CKOXtO4cEJK769FE',
} as const;

// Send a conversion to Google Ads. Google Ads tracks conversions by label, so
// callers pass the conversion label configured in the Ads account.
export function trackGoogleAdsConversion(
  label: string,
  params: { value?: number; transactionId?: string } = {}
) {
  if (!label) {
    console.warn(
      '[analytics] Google Ads conversion label missing — add it to ADS_CONVERSION_LABELS'
    );
    return;
  }
  if (trackingSuppressed()) return;
  ensureAnalytics();
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    ...(params.value !== undefined
      ? { value: params.value, currency: 'USD' }
      : {}),
    ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
  });
  restoreKillSwitch();
}

/** Google Ads "Subscribe" conversion — a paid subscription was confirmed. */
export const trackSubscribeConversion = (params: {
  value?: number;
  transactionId?: string;
}) => trackGoogleAdsConversion(ADS_CONVERSION_LABELS.subscribe, params);

/** Google Ads "Subscribe page visit" conversion — visitor landed on /subscribe. */
export const trackSubscribePageVisitConversion = () =>
  trackGoogleAdsConversion(ADS_CONVERSION_LABELS.subscribePageVisit);

/** Google Ads "Signup" conversion — visitor completed registration. */
export const trackSignupConversion = (params: {
  value?: number;
  transactionId?: string;
} = {}) => trackGoogleAdsConversion(ADS_CONVERSION_LABELS.signup, params);


export const trackLogin = (method = 'email') => trackEvent('login', { method });

export const trackSignUp = (method = 'email') =>
  trackEvent('sign_up', { method });

export const trackViewPlans = (tier?: string) =>
  trackEvent('view_item_list', {
    item_list_name: 'subscription_plans',
    current_tier: tier || 'none',
  });

/**
 * Analytics counterpart of the Google Ads "Subscribe page visit" conversion, so
 * the funnel step is visible in GA alongside view_item_list / begin_checkout.
 */
export const trackSubscribePageVisit = (plan?: string) =>
  trackEvent('subscribe_page_visit', { plan_name: plan || 'none' });

export const trackSelectPlan = (params: {
  planId: string;
  planName?: string;
  billingFrequency: 'monthly' | 'yearly';
  price?: number;
}) =>
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: params.price ?? 0,
    items: [
      {
        item_id: params.planId,
        item_name: params.planName || params.planId,
        item_category: 'subscription',
        item_variant: params.billingFrequency,
        price: params.price ?? 0,
        quantity: 1,
      },
    ],
  });

export const trackPurchase = (params: {
  transactionId?: string;
  planName?: string;
  value?: number;
}) =>
  trackEvent('purchase', {
    transaction_id: params.transactionId || 'unknown',
    currency: 'USD',
    value: params.value ?? 0,
    items: [
      {
        item_name: params.planName || 'subscription',
        item_category: 'subscription',
        quantity: 1,
      },
    ],
  });

export const trackPaymentFailed = (params: {
  reason?: string;
  planName?: string;
}) =>
  trackEvent('payment_failed', {
    reason: params.reason || 'unknown',
    plan_name: params.planName || 'unknown',
  });

export const trackPaymentCanceled = (params: { planName?: string }) =>
  trackEvent('payment_canceled', {
    plan_name: params.planName || 'unknown',
  });
