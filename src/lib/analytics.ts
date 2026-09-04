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

export function isTrackedPath(pathname: string) {
  return TRACKED_PATHS.some(
    (p) => pathname === p || pathname === `${p}/`
  );
}

/**
 * Loads gtag.js once and configures GA4 + Google Ads. Safe to call repeatedly.
 */
export function ensureAnalytics() {
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
  gtag('config', GOOGLE_ADS_ID);
}

export function trackPageView(path: string) {
  if (!MEASUREMENT_ID) return;
  ensureAnalytics();
  gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!MEASUREMENT_ID) return;
  ensureAnalytics();
  gtag('event', name, params);
}

/**
 * Conversion action labels from the Google Ads account. Paste the value that
 * appears after the slash in the Ads snippet, e.g. for
 * send_to: 'AW-18425240978/AbC-D_efG-h12_34-N' the label is 'AbC-D_efG-h12_34-N'.
 */
export const ADS_CONVERSION_LABELS = {
  // "Subscribe" conversion action — fires on the payment thank-you page.
  subscribe: 'dXTwCMCDru4cEJK769FE',
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
  ensureAnalytics();
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    ...(params.value !== undefined
      ? { value: params.value, currency: 'USD' }
      : {}),
    ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
  });
}

/** Google Ads "Subscribe" conversion — a paid subscription was confirmed. */
export const trackSubscribeConversion = (params: {
  value?: number;
  transactionId?: string;
}) => trackGoogleAdsConversion(ADS_CONVERSION_LABELS.subscribe, params);


export const trackLogin = (method = 'email') => trackEvent('login', { method });

export const trackSignUp = (method = 'email') =>
  trackEvent('sign_up', { method });

export const trackViewPlans = (tier?: string) =>
  trackEvent('view_item_list', {
    item_list_name: 'subscription_plans',
    current_tier: tier || 'none',
  });

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
