# What Suspend does today, and adding Un-suspend

## What the Suspend button does

Pressing Suspend on a shop in the super admin Subscription area does three things:

1. If that shop's people have a paying Stripe subscription, it is set to **stop at the end of the current billing period** (no refund, no immediate cut-off).
2. The shop record is marked **suspended**.
3. Every user of that shop is flagged as suspended, and the paid-until date is stored as the end of the current billing period.

Effects in the app: the shop moves into the "Suspended Subscriptions" group in super admin, and their Settings > Subscription page shows a red "Suspended" badge with "Active until: <date>" instead of a renewal date. Access is not cut off immediately — it lapses when the stored end date passes. Note the same button also appears on shops in the "Expired Trials" group, where there is nothing to cancel; it just marks them suspended.

There is currently **no way to un-suspend** from the interface — nothing reverses the suspended flags.

## What to build

Add an **Un-suspend** action next to every shop in the "Suspended Subscriptions" group, with a confirmation step, that:

- Restores the Stripe subscription if it was only scheduled to stop and hasn't ended yet (so billing continues as before).
- Clears the suspended mark on the shop and on all of its users.
- Sets the shop back to a sensible state: active on its paid plan when a live Stripe subscription is found; otherwise back to trial (keeping the existing trial end date) so nothing is silently granted for free.
- Refreshes the list and shows a clear result message, including a note when the old subscription can no longer be resumed and the shop must subscribe again.

Also small clarity fixes in the same screen:

- Label the button on already-suspended shops **Un-suspend** instead of a second "Suspend" (today the same Suspend action is offered again, which does nothing new).
- Add a short line under Suspend explaining it cancels at the end of the billing period rather than immediately.

## Technical notes

- New edge function `unsuspend-subscription` mirroring `suspend-subscription`: verify the caller's token, list Stripe customers by the shop's user emails, and for subscriptions with `cancel_at_period_end: true` call `stripe.subscriptions.update(id, { cancel_at_period_end: false })`. Canceled/ended subscriptions cannot be revived — return a flag so the UI can say a fresh checkout is needed.
- Add `unsuspendSubscriber({ user_ids })` to `supabase/functions/_shared/organization-management.ts` setting `suspended: false` on the `subscribers` rows, and reuse `updateOrganization` to set `subscription_status` to `active` (paid found) or `trial` (nothing found), keeping `subscription_level` and `trial_ends_at` untouched.
- Add `unsuspendSubscription(params)` to `src/utils/supabase-helpers.ts` alongside `suspendSubscription`.
- `src/components/superadmin/SubscriptionManagement.tsx`: `handleUnsuspend` + an AlertDialog confirmation; the suspended group's button calls it; keep `onUpdate()` refresh.
- No database migration needed — `organizations.subscription_status` and `subscribers.suspended` already exist, and `getOrgStatus` in `src/utils/subscription-status.ts` already reads them, so the shop leaves the suspended group automatically once the flags are cleared.
