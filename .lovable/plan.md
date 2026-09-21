# Sign-up tracking: what it actually does, and what's still missing

## What I checked

In the app's code, the sign-up event is **not** fired on page load. It fires only after the account is genuinely created: the sign-up form's submit handler waits for the server's answer, and only on success sends both the Analytics `sign_up` event and the Google Ads "Signup" conversion, with the new user's ID attached so a refresh can't count it twice. If registration fails (email taken, validation, network) nothing is sent.

What *does* fire on page load is the ordinary page view for the sign-up page — that is normal and separate from the conversion.

So if Google Ads shows the signup action as "Page load", that is the conversion action's own setting inside your Ads account, not what the app does. For a conversion sent by an event snippet like ours, "Page load" is the correct and expected setting — leave it as it is.

One thing that genuinely is a page-load conversion, on purpose: the "Subscribe page visit" action, which fires when someone lands on the subscribe page.

## What's worth adding

1. **Mark `sign_up` as a key event in Analytics.** Without this it's recorded but doesn't count as a conversion in your reports and can't be imported into Ads. Nothing to build — it's a switch in the Analytics admin, and I'll tell you exactly where.
2. **Enhanced conversions for the signup action.** Right now the Ads conversion carries no user detail, so matching relies only on the ad click. Since we already have the person's email and name at the moment they register, the tag can send them (hashed by Google in the browser, never stored by us) which typically lifts recorded signups noticeably. Requires the customer-data terms to be accepted in your Ads account and enhanced conversions turned on for that action.
3. **A value on the signup conversion.** Signups are free, so a value isn't required, but giving them a nominal value lets Ads optimise and report on them consistently. Optional — say the word and I'll set one.
4. **Leave the rest untouched.** Sign-in, plans viewed, plan selected, subscribe page visit, purchase and cancellation keep firing exactly as they do today, and internal pages stay untracked by Analytics.

## Technical notes

- `src/pages/auth/Register.tsx:248-249` — `trackSignUp('email')` and `trackSignupConversion({ transactionId: data?.id })` run inside the `else if (data)` success branch of `handleSubmit`; `data` is the created user object from `AuthContext.signUp`, so `data.id` is the auth user ID. No change needed to placement.
- Enhanced conversions: in `src/lib/analytics.ts`, add an optional `userData` argument to `trackGoogleAdsConversion` that issues `gtag('set', 'user_data', { email, address: { first_name, last_name } })` before the conversion event, and pass the registrant's email/name from `Register.tsx`. Applies only to the Ads conversion; no user data goes to Analytics.
- Optional value: pass `value` to `trackSignupConversion`; the helper already forwards `value` + `currency: 'USD'`.
- No changes to `TRACKED_PATHS`, the Analytics kill switch, the super-admin opt-out, or the history unhook.

## Verification

Load the sign-up page in a browser and confirm no conversion request leaves the page on load; then complete a registration and confirm exactly one Ads conversion with the signup label plus one Analytics `sign_up` event, each carrying the new user's ID.
