Switch the app's billing integration from the current Stripe account to a different/new Stripe account.

## Current state
- The app uses a bring-your-own-key Stripe integration via Supabase Edge Functions.
- Secrets in use: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- Edge functions that touch Stripe: `create-checkout`, `stripe-webhook`, `customer-portal`, `suspend-subscription`, `check-subscription`, `get_all_subscriptions`.
- Checkout sessions are created dynamically from the `subscription_plans` table; no hardcoded Stripe Price IDs exist in code.
- The webhook endpoint is `https://zugmebtirwpdkblijlvx.supabase.co/functions/v1/stripe-webhook`.

## What needs to change

### 1. Update Supabase secrets
- Rotate `STRIPE_SECRET_KEY` to the new Stripe account's secret key (`sk_live_...` or `sk_test_...`).
- Rotate `STRIPE_WEBHOOK_SECRET` to the new Stripe account's webhook signing secret.
- No code changes are required for this step; the edge functions read these secrets at runtime.

### 2. Reconfigure the webhook in the new Stripe account
- In the new Stripe Dashboard, register the endpoint: `https://zugmebtirwpdkblijlvx.supabase.co/functions/v1/stripe-webhook`.
- Select the event `checkout.session.completed`.
- Copy the new webhook signing secret and save it as `STRIPE_WEBHOOK_SECRET`.

### 3. Recreate products/prices if needed
- The current `create-checkout` function dynamically creates a Stripe price on checkout using `subscription_plans.price_monthly` / `price_yearly`.
- No migration of Stripe Product/Price IDs is needed unless you want to switch to pre-created Stripe Price IDs.
- If you want to keep the same plan names and prices, no database changes are needed.

### 4. Decide how to handle existing subscriptions
- Existing subscriptions in the old Stripe account will continue billing there unless you cancel them.
- The app checks subscriptions by looking up the Stripe customer by email, so users with active subscriptions only in the old account will no longer be detected as subscribed after the switch.
- Recommended approach:
  - Cancel old subscriptions at period end (or immediately) in the old Stripe dashboard.
  - Ask affected users to resubscribe through the new checkout flow.
  - Alternatively, manually update `organizations.subscription_status` / `subscription_level` for users with active time remaining on the old account.

### 5. Verify after the switch
- Run a test checkout in the new Stripe account (test mode first, then live).
- Confirm the webhook reaches `stripe-webhook` and updates the organization's subscription status.
- Confirm `customer-portal` opens for customers created in the new account.
- Check `check-subscription` returns the correct tier for a subscribed user.

## Out of scope unless requested
- Migrating subscription data from the old Stripe account.
- Changing plan pricing or feature gates.
- Switching to Lovable's built-in Stripe/Paddle payments integration.

## Steps to implement
1. Obtain the new Stripe account's `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
2. Use `secrets--update_secret` to rotate both secrets in Supabase.
3. Register the webhook endpoint in the new Stripe dashboard.
4. Optionally cancel or grandfather existing subscriptions from the old account.
5. Run end-to-end checkout and webhook verification.