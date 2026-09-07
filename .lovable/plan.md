# Rework Suspend in Super Admin

## What's wrong today

Checked the suspend/un-suspend code paths and the access guard:

- **Suspend can silently do nothing in Stripe.** It searches Stripe by the shop members' email addresses only, ignoring the Stripe customer already saved for that shop — the same fault we just fixed for the owner-side Cancel button. When no match is found it still shows "Subscription updated successfully".
- **Suspending doesn't actually cut off access.** The shop is flagged as suspended, but the app's access check only looks at "is subscribed", which stays true — so a suspended shop keeps working normally until the paid period runs out.
- **No confirmation and no busy state on Suspend.** One click acts immediately (Un-suspend has a confirmation, Suspend doesn't), and the button gives no clear "working…" feedback tied to the real result.
- **Suspend is really just "cancel at period end".** It behaves identically to a customer cancelling, which makes the super admin list confusing now that there is a separate "Cancelled by customer" group.
- **Super admins who sign in through the fallback route** (not a normal account) have no real session, so the suspend/un-suspend actions would be rejected on the server.

## Proposed behaviour

Suspend becomes an immediate, deliberate block:

1. **Immediate lockout.** A suspended shop is blocked right away — every screen except Settings — and its Settings page shows: "Your account has been suspended. Please contact support." No feature access, no invoicing.
2. **Billing stops.** The Stripe subscription is set to cancel at the end of the paid period (no refund logic), found via the shop's saved Stripe customer, with email lookup only as a fallback. If nothing is found in Stripe the shop is still suspended, and the message says billing could not be changed.
3. **Honest feedback.** Suspend gets a confirmation dialog explaining exactly what happens, a spinner while it runs, and a result message that distinguishes "suspended and billing stopped" from "suspended, but no live subscription was found".
4. **Un-suspend** keeps its confirmation, gets the same saved-customer lookup, and restores either the live plan or trial exactly as it does now.
5. **Suspend stays hidden** for expired trials, ended and already-cancelled shops (only paid/active shops can be suspended), matching the earlier change.

## Technical notes

- `supabase/functions/suspend-subscription/index.ts` and `unsuspend-subscription/index.ts`: resolve the Stripe customer from `subscribers.stripe_customer_id` for the organization first, fall back to email lookup; return a structured result (`suspended`/`resumed`, `billing_changed`, `period_end`, `message`); fix the mislabeled `[CANCEL-SUBSCRIPTION]` log prefix in the suspend function; keep them writing `organizations.subscription_status = 'suspended'` and `subscribers.suspended = true`.
- `supabase/functions/check-subscription/index.ts`: when the org is suspended, return `subscribed: false` alongside `suspended: true` so the guard blocks access, and keep `expired_reason: 'suspended'` for the Settings message.
- `src/components/SubscriptionRoute.tsx`: no logic change needed once `subscribed` is false, but verify Settings remains reachable.
- `src/components/settings/SubscriptionSettingsTab.tsx`: add the suspended notice branch and hide plan/cancel controls while suspended.
- `src/components/superadmin/SubscriptionManagement.tsx`: add an `AlertDialog` confirmation plus per-row busy state for Suspend, surface the returned message, and update the helper text under the active list.
- `src/utils/supabase-helpers.ts`: widen the `suspendSubscription` return type to the new result shape.
- Both functions already have valid `deno.json` entries in `supabase/config.toml`; re-deploy after the edits and confirm they answer (401 unauthenticated) rather than 404.
