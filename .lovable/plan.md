# Keep the intended tracking working after the app-wide switch-off

## What's confirmed today

Tracking now switches off as soon as someone leaves the sign-in, sign-up, subscribe or payment result pages. Checking where each event is sent from:

- Login (`login`) — sent from the sign-in page. Works.
- Registration (`sign_up` + the Google Ads Signup conversion) — sent from the sign-up page. Works.
- Subscribe page visit (Google Ads conversion) — sent from `/subscribe`. Works.
- Purchase / thank-you (`purchase`, Google Ads Subscribe conversion, plus `payment_failed`) — sent from the payment success page. Works.
- Cancellation (`payment_canceled`) — sent from the payment cancelled page. Works.
- **Plans viewed and plan selected (`view_item_list`, `begin_checkout`) — sent from the Subscription tab inside Settings, which is one of the pages now switched off. These two would be silently dropped.**

## The change

Treat the switch-off as "no automatic page tracking anywhere outside the allowed pages", not "no events at all":

1. When one of our own events or conversions is sent, briefly re-enable the tags for that single send, then switch them back off if the current page isn't one of the allowed ones.
2. Keep automatic page views limited to the allowed pages, so no page in the app reports itself.

Result: nothing is reported just for browsing the app, while all six things you listed — login, registration, subscribe page visit, plans viewed, plan selected, purchase/thank-you and cancellation — continue to report.

## Technical detail

In `src/lib/analytics.ts`: `trackEvent` and `trackGoogleAdsConversion` call `setTrackingEnabled(true)` before the `gtag` push (already happens via `ensureAnalytics`) and then restore the disabled state on a short timeout when `isTrackedPath(window.location.pathname)` is false, so the hit leaves before the kill switch returns. `AnalyticsTracker` keeps disabling on every route change to a non-tracked path. No changes to the event names, parameters or Ads conversion labels.

## Verification

Load the sign-in page, then navigate through internal pages and confirm no `google-analytics.com/g/collect` or Ads requests fire; then open Settings > Subscription and confirm the plans-viewed and plan-selected hits do fire.
