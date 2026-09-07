# Keep super admin out of Google Analytics

Today the super admin screens already sit outside the small list of pages that report to Google (sign-in, sign-up, subscribe, payment result). What is still possible: if a super admin signs in through the normal sign-in page, that sign-in is reported and counted like any customer's, and the Google tag stays loaded in memory for the rest of their visit.

## What changes

- Super admin pages (`/superadmin/...`) become explicitly blocked, not just "not listed": while on them, nothing is loaded and nothing is sent.
- Once an account is recognised as a super admin, tracking is switched off for the whole rest of that visit — even on the sign-in or subscribe pages — and no sign-in, plan or conversion events are sent for them.
- Everything else stays exactly as it is: real customers' sign-in, registration, subscribe page visit, plans viewed, plan selected, purchase and cancellation, plus both Google Ads conversions.

## Technical notes

- `src/lib/analytics.ts`:
  - Add `BLOCKED_PATH_PREFIXES = ['/superadmin']` and `isBlockedPath(pathname)`; `isTrackedPath` returns false for blocked paths.
  - Add an opt-out: `setAnalyticsOptOut(true)` writes a `sessionStorage` flag (`ga-optout`) and calls `setTrackingEnabled(false)`; `isOptedOut()` reads it. Guard `ensureAnalytics`, `trackPageView`, `trackEvent`, and the Ads conversion helpers with an early return when `isOptedOut()` or `isBlockedPath(location.pathname)` is true.
  - `restoreKillSwitch` treats opted-out sessions as never re-enabling.
- `src/context/AuthContext.tsx`: when the resolved session is a super admin (existing `isSuperAdmin` check), call `setAnalyticsOptOut(true)`.
- `src/pages/auth/Login.tsx`: only call `trackLogin('email')` for non-super-admin sign-ins (skip when the super admin check is true).
- `src/pages/superadmin/SuperAdminLogin.tsx`: call `setAnalyticsOptOut(true)` on mount so the flag is set before any dashboard route renders.
- Verify with Playwright: super admin sign-in then dashboard navigation produces no `*/g/collect*` hit for either `G-F2JSW9BNC0` or `AW-18425240978`; a normal sign-in on `/auth/login` still fires its hits.

Figures already collected in Google Analytics stay in your reports; this only affects new visits.
