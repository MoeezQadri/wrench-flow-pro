# Fix the misconfigured Ads conversions by routing them through Analytics

## What I found

Checked in a real browser:

- On the sign-up page, the sign-up conversion does reach Google with the correct label (`ep72CKOXtO4cEJK769FE`).
- On `/subscribe`, the subscribe-page-visit conversion also reaches Google (`_W9eCI7up-4cEJK769FE`) before the redirect.

So nothing is broken in the sending. Google Ads reports these two as "misconfigured" because its own check looks at the page source for the Ads tag, and this app adds the tag only after it loads (deliberately, so internal pages are not tracked). The conversion that works today is the one coming from Analytics, which needs no page-source tag.

Chosen direction: send everything through Analytics and import those events into Ads as conversions.

## What changes in the app

1. Every conversion moment becomes a clean Analytics event, with amount and currency where relevant:
   - Registration completed -> `sign_up`
   - Landing on `/subscribe` -> new event `subscribe_page_visit` (plan name included)
   - Paid subscription confirmed on the thank-you page -> `purchase` (amount, currency, order id)
   - Plans viewed / plan selected -> unchanged (`view_item_list`, `begin_checkout`)
2. The direct Ads conversion pings for sign-up, subscribe-page-visit and paid subscription are switched off, so a conversion is never counted twice once the Analytics events are imported into Ads.
3. The Ads tag itself stays loaded on the sign-in, sign-up, subscribe and payment pages only, so remarketing keeps working and no page inside the app is reported. Nothing goes back into the page source.

## What you do in Google Ads (one-off)

1. Make sure the Analytics property `G-F2JSW9BNC0` is linked to the Ads account (Ads > Tools > Data manager / Linked accounts > Google Analytics).
2. In Analytics, mark `sign_up`, `subscribe_page_visit` and `purchase` as key events.
3. In Ads > Goals > Conversions > New conversion action > Import > Google Analytics 4, import those three.
4. Pause or remove the two old website conversion actions that show "misconfigured" so the same action is not counted twice.

Imported conversions can take up to 24-48 hours to show data, and Analytics key events appear in the import list only after the event has been received at least once.

## Technical notes

- `src/lib/analytics.ts`: add `trackSubscribePageVisit(plan?)` as a `trackEvent` call; keep `trackGoogleAdsConversion` available but stop exporting/using `trackSignupConversion`, `trackSubscribePageVisitConversion`, `trackSubscribeConversion`; keep `ADS_CONVERSION_LABELS` commented as unused in case you revert.
- `src/pages/SubscribeRedirect.tsx`: call `trackSubscribePageVisit(plan)` instead of the Ads conversion.
- `src/pages/auth/Register.tsx`: keep `trackSignUp('email')`, drop `trackSignupConversion`.
- `src/pages/PaymentSuccess.tsx`: keep `trackPurchase` with amount/currency/transaction id, drop `trackSubscribeConversion`.
- No change to the tracked-path allowlist, the super-admin opt-out, or the history unhook.

## Verification

Load `/auth/register` and `/subscribe` in a browser and confirm an Analytics hit with `en=sign_up` / `en=subscribe_page_visit` and no `googleadservices.com/pagead/conversion` request; then confirm in Analytics Realtime/DebugView that the events arrive.
