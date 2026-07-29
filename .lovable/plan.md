
## Verification Results

### 1. Price IDs — no changes needed
`create-checkout` builds `price_data` inline from `subscription_plans` rows (amount + currency + interval). It does **not** store or reference Stripe price IDs. The four active plans in `subscription_plans` (Trial $0, Basic $29/$290, Professional $79/$790, Enterprise $199/$1990) will work against any Stripe account as-is.

### 2. How subscriptions flow today
- **`create-checkout`** — looks up (or creates) a Stripe customer by user email in the current Stripe account, cancels their prior active subscription in that account, opens Checkout.
- **`stripe-webhook`** — on `checkout.session.completed`, sets `organizations.subscription_status = 'active'` and `subscription_level = <plan name>` for the caller's org. Note: it also filters on `.eq('profile_email', userEmail)`, but `organizations` has no `profile_email` column — this filter is a no-op / likely silently fails updates. Flagging but out of scope for the Stripe switch.
- **`check-subscription`** — owner-email bypass → then a **fast path** that returns `subscribed=true` straight from the `subscribers` table if a row exists for the org → otherwise falls back to Stripe lookup by admin/owner emails in the org.
- **`customer-portal`** — looks up Stripe customer by email in the current account.

### 3. Current state
- `subscribers`: 26 total, 6 with `stripe_customer_id` set, 6 `subscribed = true`. These IDs (`cus_...`, subscription IDs) belong to the **old** Stripe account and will not resolve in the new one.
- `organizations`: 28 trial, 2 professional-active, 1 basic-active, 2 enterprise-active, 1 basic-suspended, 1 "Professional"-active (case mismatch).

### 4. Impact of switching keys without cleanup
- Existing paying orgs would still be treated as subscribed by the fast path (correctly, since they've paid), **but** any Customer Portal button will fail because `cus_...` doesn't exist in the new account, and their next renewal won't happen (no subscription in the new account). They need to re-subscribe via Checkout.
- `check-subscription` fast path will keep saying "subscribed" until `subscription_end` passes, masking that they actually have no billing in the new account.

## Cleanup Plan

**Step A — You rotate secrets in Lovable (already offered):**
- `STRIPE_SECRET_KEY` → new account's secret key
- `STRIPE_WEBHOOK_SECRET` → new account's webhook signing secret (endpoint `https://zugmebtirwpdkblijlvx.supabase.co/functions/v1/stripe-webhook`, event `checkout.session.completed`)

**Step B — Reset stale subscriber cache** (SQL run after Step A):
```sql
-- Null out old Stripe references
UPDATE public.subscribers
SET stripe_customer_id = NULL,
    subscribed = false,
    subscription_tier = NULL,
    subscription_end = NULL,
    updated_at = now();
```
This forces `check-subscription` to fall through the fast path and re-resolve against the new Stripe account. Trials remain intact (they don't rely on `subscribers`).

**Step C — Reset organization subscription state for paid tiers** (SQL):
```sql
-- Revert previously paid orgs to trial so they must re-subscribe in the new account
UPDATE public.organizations
SET subscription_level = 'trial',
    subscription_status = 'active',
    updated_at = now()
WHERE lower(subscription_level) IN ('basic','professional','enterprise');
```
Optional — skip this if you plan to grandfather affected orgs manually.

**Step D — Verify end-to-end (I run after Step A):**
1. Call `check-subscription` for a test account → expect `subscribed=false` (or trial).
2. Call `create-checkout` with plan `Basic` → confirm Stripe returns a session URL in the new account.
3. Complete a test purchase → confirm webhook signature validates and `organizations` row flips to `active`.
4. Call `customer-portal` → confirm it opens against the new account.
5. Tail `check-subscription`, `create-checkout`, `stripe-webhook` logs for errors.

## Out of scope (flagged, not fixed here)
- `stripe-webhook` bug: `.eq('profile_email', userEmail)` filter on `organizations` update — organizations has no such column, so webhook updates likely never persist. Worth fixing in a follow-up.
- Case-mismatch in `subscription_level` ("Professional" vs "professional") — `useSubscriptionLimits` may treat them differently.

## Technical Notes
- No frontend code changes required.
- No edge function code changes required for the account switch itself.
- Migration tool is used for the SQL in Steps B and C (data updates via the update path).
