# Add the Google Ads tag directly in index.html

Yes — this is possible and is the more reliable setup. The Ads snippet can live as a plain script tag in `index.html`, loading before React boots, exactly as Google gives it to you.

## Why it isn't tracking today

Right now the Ads ID is registered from JavaScript inside `src/lib/analytics.ts`, after React mounts. That path depends on the app's own analytics init running correctly, so anything that delays or skips it means the Ads tag never configures. Pasting Google's snippet into the page head removes that dependency.

## What will change

1. `index.html` — add Google's official Ads snippet in `<head>`:
   - `<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18425240978">`
   - inline script that creates `dataLayer`, defines the standard `gtag` function, then `gtag('js', new Date())` and `gtag('config', 'AW-18425240978')`.
2. `src/lib/analytics.ts` — stop configuring the Ads ID from JS (remove the `gtag('config', GOOGLE_ADS_ID)` call) so the tag is configured exactly once and page loads are not double counted. GA4 config and all existing event tracking stay unchanged and keep working, because both tags share the one gtag.js library and `dataLayer` that the head snippet creates.
3. `trackGoogleAdsConversion(label, value?)` stays available for wiring conversions later; it will now talk to the head-loaded tag.

## Verification

Load the app in a browser and confirm in the network log:
- a request to `googletagmanager.com/gtag/js?id=AW-18425240978`
- a `google-analytics.com/g/collect` (or `googleads.g.doubleclick.net`) hit carrying the `AW-18425240978` ID on page load
- GA4 page_view and login events still fire (no regression)

Then check Google Ads > Tools > Tag Assistant / "Recent activity" on the conversion tag — it should report the tag as active within a few minutes of publishing.

## Note

The tag only becomes live for real visitors after you publish. Also, for Ads to record actual conversions (signup, purchase) you still need the conversion labels from your Google Ads account — say the word and I'll plan wiring those to the signup and purchase events.
