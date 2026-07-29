## Current behavior

Subscription expiry is already organization-scoped in `supabase/functions/check-subscription/index.ts`:

1. The function resolves the caller's `organization_id` from `profiles`.
2. It looks up the `subscribers` cache row for that organization and checks both `subscribed = true` AND `subscription_end > now()`.
3. If the cached subscription is expired, it falls through to Stripe and checks active subscriptions for any owner/admin in the organization.
4. If no active Stripe subscription is found, every user in the org falls back to the 14-day trial based on `organizations.created_at`.
5. The hardcoded owner bypass (`OWNER_EMAILS`) returns `subscription_end: null`, so it never expires.

## Result

- When a paid subscription expires, **all users in the same organization** lose paid access together.
- When any owner/admin renews or starts a subscription, **all users in the organization** regain access.
- No code changes are required.

## Technical details

- File: `supabase/functions/check-subscription/index.ts`
- Key logic: fast-path cache check at lines 141–166, Stripe fallback at lines 168–223, trial fallback at lines 225–228.