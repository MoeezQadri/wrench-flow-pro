# Fix Google Analytics not recording login / signup

## What I found

The tracking code exists and is wired up: login fires `login`, registration fires `sign_up`, plan selection fires `begin_checkout`, and payment pages fire `purchase` / `payment_canceled`. The GA measurement ID (`G-F2JSW9BNC0`) is present and the gtag script does load in the browser.

But when I loaded the app in a real browser and watched network traffic, the gtag library loaded and **no measurement request was ever sent to Google** (no hit to `google-analytics.com/g/collect`). So GA receives nothing — not page views, not login, not sign_up.

Cause: in `src/lib/analytics.ts` the `gtag` helper pushes a plain **array** into `dataLayer`:

```text
window.dataLayer.push(args)   // args is an Array
```

Google's gtag.js only interprets a pushed item as a command when it is the function's `arguments` object, not a real array. Every `js`, `config`, and `event` call is therefore ignored — which matches the observed "script loads, nothing is sent".

## The fix

1. `src/lib/analytics.ts`
   - Rewrite the `gtag` helper to push the `arguments` object (the standard snippet form) instead of an array, so `config` and all `event` calls are actually processed.
   - Remove the duplicate initial page view: keep `send_page_view` on config OR the manual tracker, not both. Plan: set `send_page_view: false` in `config` and let `AnalyticsTracker` send every page view (including the first), so SPA navigation and first load are counted exactly once.
2. No changes needed to the event names or to the login/register/subscription call sites — they are correct and will start reporting once the helper is fixed.

## Verification

After the change I will load the app in a headless browser and confirm:
- a `google-analytics.com/g/collect` request fires on page load,
- a second collect request with `en=login` fires after a login attempt,
- exactly one `page_view` per route change (no duplicates).

Then in your GA4 property, check **Reports > Realtime** and **Admin > DebugView** while using the published app; the events `login`, `sign_up`, `begin_checkout`, and `purchase` should appear within a minute or two.

## Notes

- GA4 custom events can take up to 24-48h to appear in standard reports; Realtime/DebugView is the correct place to confirm immediately.
- If you have ad-blocking or tracking protection in your own browser, hits will be blocked locally — verify in a clean browser profile.
