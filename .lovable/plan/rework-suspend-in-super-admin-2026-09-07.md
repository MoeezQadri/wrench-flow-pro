# Rework Suspend in Super Admin

## What's wrong today

Checked the suspend/un-suspend code paths and the access guard:

- **Suspend can silently do nothing in Stripe.** It searches Stripe by the shop members' email addresses only, ignoring the Stripe customer already saved for that shop — the same fault we just fixed for the owner-side Cancel button. When no match is found it still shows "Subscription updated successfully".
- **No confirmation and no busy state on Suspend.** One click acts immediately (Un-suspend has a confirmation, Suspend doesn't), and the button gives no clear "working…" feedback tied to the real result.
- **The end date isn't shown or acted on.** Suspended shops don't display when their access lapses, and nothing moves them into the ended group when that date passes unless someone from the shop happens to sign in.
- **Super admins who sign in through the fallback route** (not a normal account) have no real session, so the suspend/un-suspend actions would be rejected on the server.

## Proposed behaviour

Suspend keeps working like a cancellation — billing stops at the end of the paid period and the shop keeps access until then:

1. **Stops billing correctly.** The Stripe subscription is set to cancel at the end of the current paid period, found via the shop's saved Stripe customer, with email lookup only as a fallback. The shop is marked suspended, and access continues until the period end date, exactly as with a customer-initiated cancellation.
2. **Honest feedback.** Suspend gets a confirmation dialog spelling out that access ends on the period end date, a spinner while it runs, and a result message that distinguishes "billing stopped, access ends on <date>" from "no live subscription was found in Stripe".
3. **The end date is visible.** Each suspended shop in super admin shows "Access ends on <date>", and once that date passes it appears under Expired Trials & Ended Subscriptions instead of staying in the suspended list forever.
4. **Access ends on that date reliably.** The same end-of-period handling used for customer cancellations applies to suspensions, so the shop is locked out (Settings only) when the date passes even if nobody signs in, and its Settings page explains the account was suspended and to contact support.
5. **Un-suspend** keeps its confirmation, gets the same saved-customer lookup, and restores either the live plan or trial as it does now.
6. **Suspend stays hidden** for expired trials, ended and already-cancelled shops — only paid/active shops can be suspended.

## Technical notes

- `supabase/functions/suspend-subscription/index.ts` and `unsuspend-subscription/index.ts`: resolve the Stripe customer from `subscribers.stripe_customer_id` for the organization first, fall back to email lookup; return a structured result (`suspended`/`resumed`, `billing_changed`, `period_end`, `message`); persist `period_end` to `organizations.trial_ends_at`-equivalent subscription end and `subscribers.subscription_end`; fix the mislabeled `[CANCEL-SUBSCRIPTION]` log prefix in the suspend function; keep writing `organizations.subscription_status = 'suspended'` and `subscribers.suspended = true`.
- `supabase/functions/check-subscription/index.ts`: extend the existing "canceling reached its end date" branch to cover `suspended` — when the stored end date has passed, write status `ended` and return `subscribed: false` with `expired_reason: 'suspended'`; while the date is still in the future keep returning `subscribed: true, suspended: true`.
- `supabase/functions/stripe-webhook/index.ts`: the `customer.subscription.deleted` handler already flips orgs to `ended`; confirm suspended orgs are covered by it so the lockout doesn't depend on a login.
- `src/components/settings/SubscriptionSettingsTab.tsx`: for a suspended shop show "Your account has been suspended — access ends on <date>. Please contact support." and hide the cancel/resume controls.
- `src/components/superadmin/SubscriptionManagement.tsx`: add an `AlertDialog` confirmation plus per-row busy state for Suspend, show the access-end date on suspended rows, surface the returned message, and adjust the helper text.
- `src/utils/subscription-status.ts`: treat a suspended org whose end date has passed as ended so it groups under Expired Trials & Ended Subscriptions.
- `src/utils/supabase-helpers.ts`: widen the `suspendSubscription` return type to the new result shape.
- Both functions already have valid `deno.json` entries in `supabase/config.toml`; re-deploy after the edits and confirm they answer (401 unauthenticated) rather than 404.
