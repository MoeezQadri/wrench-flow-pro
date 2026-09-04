# Limit tracking to sign-in, sign-up, subscription and payment pages

Today both Google trackers load for everyone, everywhere: the Google Ads tag is hard-coded into the page head (so it fires on every page load, including the dashboard and all internal pages), and the Google Analytics tag starts as soon as the app boots and then reports a page view on every screen change.

The goal: trackers only load and only report on the login, sign-up, subscription and payment thank-you / cancelled pages.

## What changes

- The Ads tag comes out of the page head, so it no longer fires automatically on every page.
- Both tags load on demand, the first time the visitor lands on one of the allowed pages:
  - Login (`/auth/login`)
  - Sign-up (`/auth/register`)
  - Subscription entry from your marketing site (`/subscribe`)
  - Payment thank-you (`/payment/success`) and payment cancelled (`/payment/canceled`)
- Page-view reporting is restricted to that same list. On the dashboard, invoices, customers, reports and every other internal screen, nothing is loaded and nothing is sent.
- The events you already rely on keep working: login, sign-up, plan selection, purchase, payment failed, payment cancelled. Plan selection happens on the Subscription tab in Settings, which is not in the allowed page list, so that specific action loads the tag at the moment the user picks a plan — but no page views are recorded for Settings itself.

## Will this cause issues?

- No loss of the conversions that matter to you: sign-ups, logins, checkout starts, purchases and cancellations all still report.
- You will see fewer page views in Analytics overall, and internal-app engagement metrics (pages per session, time on internal screens) will effectively disappear. That is the intent of the request, but worth knowing before comparing to historical reports.
- Once a visitor loads a tracked page, the tag stays loaded for the rest of that browsing session — it will not report page views for internal screens, but Analytics may still attribute later events in that session. This is unavoidable with a single tag library and does not send extra page data.
- Google Ads conversion tracking still needs the conversion labels wired up in your Ads account; no labels are attached to events yet, so Ads currently records the tag load only. Say the word if you want the sign-up or purchase conversion wired next.

## Technical notes

- `index.html`: remove the `AW-18425240978` snippet from `<head>`.
- `src/lib/analytics.ts`: replace the eager `initAnalytics()` with an idempotent `ensureAnalytics()` that injects `gtag.js` once and configures both the GA4 measurement ID (`send_page_view: false`) and `AW-18425240978`. `trackEvent` / `trackGoogleAdsConversion` call `ensureAnalytics()` first, so event-driven pages work without being on the allowlist. Export a `TRACKED_PATHS` allowlist plus an `isTrackedPath(pathname)` helper (`/auth/login`, `/auth/register`, `/subscribe`, `/payment/success`, `/payment/canceled`).
- `src/main.tsx`: drop the `initAnalytics()` call.
- `src/components/AnalyticsTracker.tsx`: return early when `isTrackedPath(location.pathname)` is false; otherwise `ensureAnalytics()` then `trackPageView`.
- No changes needed in `Login.tsx`, `Register.tsx`, `PaymentSuccess.tsx`, `PaymentCanceled.tsx`, or `SubscriptionSettingsTab.tsx` — their `trackEvent`-based calls self-initialise.
- Verify with `tsgo --noEmit`, the build log, and a headless browser check that `googletagmanager.com/gtag/js` and `google-analytics.com/g/collect` fire on `/auth/login` but not on an internal route.
