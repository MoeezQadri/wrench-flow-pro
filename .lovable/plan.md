
## Problem

`check-subscription` resolves subscription per individual user. Invited teammates (and any owner whose login email differs from the Stripe billing email) get `subscribed: false` and are redirected to `/settings` by `SubscriptionRoute`.

## Fix

Rewrite `supabase/functions/check-subscription/index.ts` to answer based on the caller's **organization** instead of just their own email/user_id. Keep the existing `OWNER_EMAILS` bypass exactly as-is.

New flow inside the function:

1. Authenticate the user (unchanged).
2. `OWNER_EMAILS` bypass → return Enterprise (unchanged).
3. Look up caller's `profiles.organization_id`. If none → return `{ subscribed: false }`.
4. Resolve subscription for that organization, in order:
   1. Fast path: query `subscribers` for `organization_id = <org> AND subscribed = true`. If found, return its `subscription_tier`, `subscription_end`, and `suspended`.
   2. Stripe path: fetch all `profiles` in the org with role `owner`/`admin`, join their emails via `auth.admin`, and for each call `stripe.customers.list({ email })` + `stripe.subscriptions.list({ customer, status: 'active', limit: 1 })`. First match wins. Determine tier from `price.unit_amount` using the existing thresholds (0 → Trial, ≤2900 → Basic, ≤7900 → Professional, else Enterprise). Upsert a `subscribers` row with `organization_id`, that owner's `user_id`/`email`/`stripe_customer_id`, `subscribed=true`, tier, and period end so future calls hit the fast path.
5. If no active subscription anywhere in the org, fall back to `checkTrialStatus(supabaseClient, user.id)` (already org-based via `organizations.created_at + 14 days`).
6. Return `{ subscribed, subscription_tier, subscription_end, suspended }`.

## Technical notes

- Only file changed: `supabase/functions/check-subscription/index.ts`.
- Uses the existing service-role `supabaseClient`, so it can read all org profiles and upsert `subscribers` without RLS friction.
- `subscribers` already has `organization_id`; no migration required.
- `AuthContext.checkSubscriptionStatus` already consumes `{ subscribed, subscription_tier, subscription_end, suspended }` — no frontend changes.
- `OWNER_EMAILS` bypass preserved verbatim.

## Out of scope

- Restructuring `subscribers` to be strictly one row per org.
- Per-seat billing enforcement (handled by `useSubscriptionLimits`).
- Any Settings/Subscription UI changes.
