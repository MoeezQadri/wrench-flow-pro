# Check the registration event really reaches Google

## What the app sends today (confirmed in the code)

- Google Analytics: an event named **`sign_up`**, with `method: email`.
- Google Ads: a **`conversion`** sent to **AW-18425240978** with the label **`ep72CKOXtO4cEJK769FE`** — the action you named "Signup / Register" in Ads.

Both fire only after the server confirms the account was created, on the sign-up page itself (there is no redirect straight after, so the hits have time to leave the browser). Nothing is sent when registration fails.

## What I'll do

1. Run a real registration in the running app with a throwaway email and shop name, while recording every request the page makes to Google.
2. Report exactly what was sent:
   - whether a hit with `en=sign_up` reaches Google Analytics
   - whether a `conversion` hit for AW-18425240978 with the Signup label goes out
   - the response status of each, and any hit that is blocked or dropped
3. If the app sends both correctly, the problem is on the Google side and I'll tell you precisely where to look (Analytics Realtime vs the Ads conversion action's status, e.g. "No recent conversions" or "Inactive", and whether the label in your Ads snippet matches the one above).
4. If a hit is missing, I'll name the cause and propose the fix in a follow-up plan before changing any code.

## Notes

- This creates one real test account and one real shop record in your database. I'll tell you the exact email used so you can delete it, or I can remove it afterwards if you'd rather.
- Google Ads typically takes a few hours to show a first conversion, and Analytics custom events can take 24-48h to appear in standard reports — Realtime/DebugView is the only place to confirm immediately.

## Technical notes

- Playwright script under `/tmp/browser/signup-track/`, viewport 1280x1800, listening for requests matching `*google-analytics.com/g/collect*`, `*googletagmanager.com/gtag/js*`, `*googleads.g.doubleclick.net*` and `*google.com/pagead/*`; assert `en=sign_up` with `tid=G-...` and a conversion hit carrying `AW-18425240978`.
- Verify against `src/lib/analytics.ts` (`ADS_CONVERSION_LABELS.signup`, `trackEvent` lifting `ga-disable-*`, `restoreKillSwitch`) and `src/pages/auth/Register.tsx:248-249`.
- No source changes in this step; findings first.
