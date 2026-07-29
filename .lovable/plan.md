## Recommended subscription flow from an external marketing site

### Current state
- `create-checkout` requires an authenticated user and an organization, so the external site cannot call Stripe directly.
- New users already get a 14-day trial and are redirected to `/settings` if they have no active subscription.
- The app has no public `/pricing` or `/subscribe` landing page.

### Proposed flow
1. External marketing site CTA links to a single in-app entry point: `https://app.mygaragepro.co/subscribe?plan=<plan>`.
2. If the visitor is **not logged in**, they are sent to `/auth/register?next=/settings?tab=subscription&plan=<plan>`.
3. After registration and email confirmation, they land on **Settings > Subscription** with the chosen plan highlighted.
4. If the visitor is **already logged in**, they go straight to **Settings > Subscription**.
5. The user then manually clicks the plan CTA inside the app to start Stripe checkout.

### Implementation steps

1. **Add a `/subscribe` redirect route**
   - Create a small public component at `/subscribe`.
   - If unauthenticated: redirect to `/auth/register?next=/settings?tab=subscription&plan=<plan>`.
   - If authenticated: redirect to `/settings?tab=subscription&plan=<plan>`.
   - Register the route in `src/App.tsx` outside the protected layout.

2. **Respect `next` query param on auth pages**
   - Update `PublicRoute.tsx` so that an already-authenticated user hitting `/auth/login` or `/auth/register` with a `next` param is redirected to that URL instead of `/`.

3. **Preserve intent through email confirmation**
   - Update `Register.tsx` to read `next` and `plan` from the URL and include them in the Supabase `emailRedirectTo`.
   - Update `ConfirmEmail.tsx` to parse those params after confirmation and redirect to `/settings?tab=subscription&plan=<plan>`.

4. **Surface the plan hint in Settings**
   - Update `Settings.tsx` to read the `tab` query param and default to the `subscription` tab.
   - Update `SubscriptionSettingsTab.tsx` to read the `plan` query param, scroll the matching card into view, and pre-select annual/monthly (no auto-checkout).

5. **External site CTA URLs**
   - Generic: `https://app.mygaragepro.co/subscribe`
   - With plan hint: `https://app.mygaragepro.co/subscribe?plan=basic` (also `professional`, `enterprise`).
   - These URLs must be updated on the external marketing site; this project only provides the in-app destination.

### Technical notes
- No backend/Supabase changes are required.
- No Stripe products need to be created; `create-checkout` still builds the session from the `subscription_plans` table.
- The flow matches your chosen behavior: account first, then show Subscription settings (no automatic checkout).

### Verification
- Logged-out visitor: `/subscribe?plan=professional` -> register page -> confirm email -> Settings opens on Subscription tab with Professional highlighted.
- Logged-in visitor: `/subscribe?plan=basic` -> Settings opens on Subscription tab with Basic highlighted.
- Already-authenticated user visiting `/auth/register?next=/settings?tab=subscription` is redirected to `/settings?tab=subscription`.