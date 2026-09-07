# Stop Google reporting pages inside the app

## What I found

Your earlier changes are live on the published site — that part is fine. I reproduced the problem in the running app and found two real leaks:

1. **The Google Ads tag reports every page on its own.** GA4 was told not to send automatic page views, but the Ads tag never was — so it reports each page the browser moves to, including the dashboard.
2. **Switching tracking off happens a moment too late.** Google's tag reacts to the address change instantly, while the app only switches tracking off after the new page has rendered. In that gap the first page you open after signing in (usually the dashboard) gets reported.

Confirmed in the browser: after loading the sign-in page and moving to `/dashboard`, a page report for `/dashboard` was still sent.

## The fix

- Tell the Ads tag not to send automatic page views, the same way GA4 is set up.
- Switch both tags off the instant the address changes to a page that shouldn't be tracked — before Google's own listener runs — instead of after the page renders.
- Keep everything we want: sign-in, sign-up, subscribe, plans viewed, plan selected, purchase on the thank-you page, cancellation, and the two Google Ads conversions all keep firing exactly as they do now.
- Re-test in the browser: from sign-in, move into the dashboard and other internal pages and confirm nothing is sent, then confirm the allowed pages and events still report.

Note: reports already collected in Google Analytics stay in your reports — the change only affects new visits.

## Technical notes

- `src/lib/analytics.ts`: add `{ send_page_view: false }` to the `gtag('config', GOOGLE_ADS_ID, …)` call. Add an `installNavigationGuard()` that patches `history.pushState` / `history.replaceState` and listens for `popstate`, calling `setTrackingEnabled(false)` synchronously whenever the new `location.pathname` is not in `TRACKED_PATHS` (and enabling for tracked paths). Install it from `ensureAnalytics()` inside `script.onload` so our wrapper sits outside gtag's own history wrapper and therefore runs first.
- Keep `restoreKillSwitch()` for explicit events fired from untracked pages (Settings → Subscription).
- `src/components/AnalyticsTracker.tsx` stays as the page-view sender for tracked paths; the guard becomes the primary kill switch.
- Verification: Playwright script capturing `*/g/collect*` requests, asserting no hit with `dl` on an internal path for either `tid` (`G-F2JSW9BNC0`, `AW-18425240978`), plus a run confirming hits still fire on `/auth/login`, `/auth/register`, `/subscribe`.
- Optional, in the Google Analytics admin (your side): under Enhanced measurement, turn off "Page changes based on browser history events" for extra safety.
