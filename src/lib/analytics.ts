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

export function initAnalytics() {
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

  // AnalyticsTracker sends every page view (incl. the first), so disable the
  // automatic one to avoid double counting.
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { send_page_view: false });

  // The Google Ads tag (AW-18425240978) is loaded and configured directly from
  // index.html, so it is not configured here.
}

export function trackPageView(path: string) {
  if (!MEASUREMENT_ID) return;
  gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!MEASUREMENT_ID) return;
  gtag('event', name, params);
}

// Send a conversion to Google Ads. Google Ads tracks conversions by label, so
// callers pass the conversion label configured in the Ads account.
export function trackGoogleAdsConversion(label: string, value?: number) {
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    ...(value !== undefined ? { value, currency: 'USD' } : {}),
  });
}

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
