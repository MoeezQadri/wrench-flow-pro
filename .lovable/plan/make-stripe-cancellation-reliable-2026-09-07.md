# Make Stripe cancellation reliable

## Confirmed issue

The cancel request reaches Stripe successfully, but Stripe returns **no subscription** for the saved customer (`cus_...`). The app still says the shop has a Basic subscription because it trusts an old database row dated August 13. The current setup stores only the Stripe customer ID, not the exact Stripe subscription ID, so cancellation has to guess which subscription to find and the database can drift away from Stripe.

## Fix

1. **Store the exact Stripe subscription.** Add a `stripe_subscription_id` field to the subscription record. At checkout completion, save both Stripe's customer ID and subscription ID, linked to the organization.
2. **Cancel by subscription ID.** Retrieve the saved `sub_...` directly and set it to cancel at the end of the paid period. Confirm Stripe returned `cancel_at_period_end = true` before showing success or changing local status.
3. **Repair existing subscriptions.** Add a safe reconciliation fallback for older rows: inspect Stripe subscriptions using the saved customer and organization/user metadata, then email only as a legacy fallback. Save the matched subscription ID. If Stripe confirms there is no live subscription, stop presenting the stale database row as active and show a clear “No live Stripe subscription found” result rather than pretending cancellation succeeded.
4. **Make checkout identity durable.** Put the organization and user IDs on both the Checkout Session and the Stripe Subscription itself. Reuse the organization’s saved Stripe customer instead of selecting the first customer with a matching email.
5. **Make Stripe the source of truth.** Process `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` using the subscription ID. The webhook updates cancellation date/status; access ends only when Stripe reports the subscription ended.
6. **Handle Stripe’s current billing-period fields.** Read the period end from the subscription item when Stripe’s newer API response does not include it at the subscription level.
7. **Show an actionable result.** Keep the loading state until Stripe answers. On success, replace the cancel button with “Your subscription ends on [date].” On mismatch, explain that no live Stripe subscription was found and do not silently return to the unchanged screen.
8. **Apply the same identity fix to super-admin suspend/un-suspend and subscription checks** so all billing actions target the same saved Stripe subscription.
9. **Verify end to end.** Test checkout linkage, cancel, refresh persistence, resume where applicable, webhook expiry, and the no-live-subscription case. Confirm the deployed routines respond correctly and the app remains build-clean.

## Technical details

- Database: add nullable `subscribers.stripe_subscription_id text`, grant no new access, and backfill only from Stripe-confirmed matches.
- `create-checkout`: use the organization’s saved customer, set `client_reference_id`, Session metadata, and `subscription_data.metadata` with organization/user/plan identifiers.
- `stripe-webhook`: require a real `session.subscription`, persist it, resolve later events by subscription ID/customer ID, and avoid marking an organization active when no Stripe subscription exists.
- `cancel-subscription`: prefer `subscriptions.retrieve(savedSubscriptionId)`; legacy discovery is fallback only; verify the update response before writing `canceling` and the end date.
- `check-subscription`, suspend, and un-suspend: retrieve by saved subscription ID first and reconcile stale cached status against Stripe.
