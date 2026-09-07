# Google Ads conversions: what's really happening, and the small fixes worth making

## What I verified in a real browser

- On the sign-up page the sign-up conversion **is** sent to Google, with the correct label (`ep72CKOXtO4cEJK769FE`).
- On `/subscribe` the subscribe-page-visit conversion **is** sent too (`_W9eCI7up-4cEJK769FE`), and it leaves the browser before the redirect.

So both conversions work. "Misconfigured tag" in Google Ads is Google's own check looking for its tag in the page's source code. This app deliberately loads the tag only after it starts up, and only on the sign-in, sign-up, subscribe and payment pages — which is exactly what you asked for when you wanted the rest of the app untracked. Google's scanner can't see a tag that isn't in the source, so it labels those two actions misconfigured even though real conversions arrive. The status normally settles once Google records live conversions.

Putting the tag back in the page source would clear the warning, but Google's Ads tag ignores the "don't report page views" setting — it would start reporting every screen inside the app again. Not worth trading that away for a status label, so the setup stays as is.

## The small fixes worth making

1. **Send an amount with the paid-subscription conversion.** Right now it sends no value, so Ads can't report revenue or return on spend. The thank-you page knows the plan, so it will send the plan price and currency.
2. **Guard against duplicate counting.** Each conversion gets a unique order reference so a page refresh or a retry can't count the same signup or purchase twice.
3. **Add a matching Analytics event for the subscribe page visit.** Today that moment is only sent to Ads; Analytics has nothing, so you can't see it in your funnel next to plans-viewed and plan-selected. A `subscribe_page_visit` event fixes that.
4. **Leave sign-in, plans viewed, plan selected, purchase, cancellation and the page limits untouched.** No change to which pages report.

## If the warning still bothers you later

You can switch these two to Analytics-imported conversions instead: link Analytics to Ads, mark `sign_up`, `subscribe_page_visit` and `purchase` as key events in Analytics, then import them in Ads under Goals > Conversions > New > Import. If you do that, pause the two website conversion actions first, or the same action gets counted twice. That path needs no page-source tag but takes 24-48 hours to start reporting, which is why it isn't the default here.

## Technical notes

- `src/lib/analytics.ts`: add `trackSubscribePageVisit(plan?)` (a `trackEvent('subscribe_page_visit', …)` call); keep the Ads conversion helpers as they are.
- `src/pages/SubscribeRedirect.tsx`: call both `trackSubscribePageVisit(plan)` and the existing `trackSubscribePageVisitConversion()`, still guarded by the existing `visitTracked` ref.
- `src/pages/auth/Register.tsx`: pass a stable `transactionId` (new user id) to `trackSignupConversion` so repeat sends dedupe.
- `src/pages/PaymentSuccess.tsx`: resolve the plan price and pass `value` to both `trackPurchase` and `trackSubscribeConversion`, alongside the existing Stripe `session_id` as the transaction id.
- No changes to `TRACKED_PATHS`, `index.html`, the super-admin opt-out, or the history unhook.

## Verification

Reload `/auth/register` and `/subscribe` in a browser and confirm the Ads conversion requests still carry the right label, that the purchase conversion now carries a value, and that no request fires from any internal page.
