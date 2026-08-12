const MEASUREMENT_ID = import.meta.env
  .VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let initialized = false;

export function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
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

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { send_page_view: true });
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
