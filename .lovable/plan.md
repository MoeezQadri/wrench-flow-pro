# Ads tag on every page, Analytics only where agreed

## How it works today

Both Google tags share one script (`gtag.js`) and one config call, so they are switched on and off together:

- The script is only loaded the first time someone opens one of the allowed pages: sign-in, sign-up, `/subscribe`, payment thank-you, payment cancelled.
- Automatic page reporting is turned off for both tags, and Google's own reaction to address changes is unhooked, so nothing is reported when moving around the app.
- The app sends its own page report, only on the allowed pages.
- Sign-in, sign-up, plans viewed, plan selected, purchase, cancellation and the three Google Ads conversions are sent as events; from a page that isn't allowed (the Subscription tab in Settings) the tags are briefly switched on for that one event and switched off again.
- Super Admin screens and internal accounts report nothing at all.

## Is what you want possible?

Yes. The two tags can be steered separately: the Ads tag can report every page while Analytics keeps reporting only the agreed pages and actions.

## What changes

- The shared script loads on the first page of every visit, not only on the allowed pages.
- **Google Ads**: reports a page view on every page and every in-app screen change, including the dashboard and internal pages.
- **Google Analytics**: unchanged from what we agreed — a page report only on sign-in, sign-up, `/subscribe`, payment thank-you and payment cancelled, plus the existing actions. Nothing from the dashboard or any other internal screen.
- **Super Admin and internal accounts**: still nothing at all, from either tag.
- All three Ads conversions and every Analytics event keep firing exactly as now.

Worth knowing: because Ads now loads on every visit, Ads will show far more traffic than before, and Analytics numbers will stay as they are. Reports already collected are unaffected.

## Technical notes

- `src/lib/analytics.ts`
  - Split the kill switch: `setAnalyticsEnabled(bool)` sets only `window['ga-disable-<G-…>']`; the Ads tag is left enabled. Keep a combined off-switch used for the internal/blocked case.
  - Keep the history hooks unhooked (Ads ignores the disable flag, so app-driven page reports remain the only reliable route) and send Ads page views explicitly: `gtag('event', 'page_view', { send_to: GOOGLE_ADS_ID, … })` on every route.
  - Add `trackAdsPageView(path)` (fires always unless blocked/opted out) and keep `trackPageView` GA4-only via `send_to: MEASUREMENT_ID`.
  - `ensureAnalytics()` no longer needs a tracked path; `trackingSuppressed()` continues to cover `/superadmin` and the opt-out flag.
  - `restoreKillSwitch()` becomes Analytics-only.
- `src/components/AnalyticsTracker.tsx`: on every route call `ensureAnalytics()` + `trackAdsPageView`; call `trackPageView` (GA4) only when `isTrackedPath`, and disable Analytics otherwise.
- No change to `index.html`, event call sites, or conversion labels.
- Verify with a Playwright run capturing `*/g/collect*` and `*googleads*`: on `/dashboard` an Ads hit exists and no `G-F2JSW9BNC0` hit; on `/auth/login` both fire; on `/superadmin/login` neither fires.
