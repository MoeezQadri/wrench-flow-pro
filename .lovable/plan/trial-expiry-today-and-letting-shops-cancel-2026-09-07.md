# Trial expiry today, and letting shops cancel

## What happens when a trial expires

Verified in the code:

- Each time someone signs in (or the subscription check runs), the app compares today against the shop's trial end date (14 days). Once it's past, the shop is reported as having no active subscription.
- The shop is then **locked out of the whole app except Settings** — every other page redirects to Settings, and the sidebar links are greyed out. Their data is untouched; they just can't work until they subscribe.
- The shop record is updated to "trial / expired", so super admin shows it under **Expired Trials** with a label like "Trial expired 12 days ago", and it's counted in the Expired Trials figure.
- Super admin has no action on those shops other than Suspend; the status updates when the shop's users sign in or when you press Refresh.

Two rough edges found in that path:

1. A **paying** shop whose subscription lapses (card fails, or it was cancelled) is relabelled "trial / expired" — so a former paying customer shows up in super admin as an expired trial, which is misleading.
2. The Settings page just says "No Active Subscription" — it doesn't tell the owner their trial ended, when, or that they must pick a plan to get back in.

## How a shop can cancel today

There is currently **no way for a shop to cancel from the app**. A Stripe billing-portal function exists in the project but nothing links to it and it isn't registered, so the only routes today are you suspending them from super admin, or the customer cancelling directly with Stripe.

## What to build

**1. Cancel subscription (owner/admin only), in Settings > Subscription**

- A "Cancel subscription" button, shown only when the shop has a live paid plan.
- Confirmation dialog explaining they keep access until the end of the period already paid for, and no refund is issued.
- Cancels at period end in Stripe, marks the shop as cancelling, and the status area then shows "Cancelling — access until <date>".
- While in that state the button becomes **"Resume subscription"**, which undoes the cancellation.

**2. Clearer expired messaging**

- On Settings, when the shop has no active subscription, show a prominent banner: trial ended on <date> (or subscription ended), and "choose a plan below to restore access".
- Stop relabelling a lapsed paid shop as a trial: keep its plan name and mark it as ended, so super admin lists it as "Subscription ended" rather than an expired trial.

**3. Super admin clarity**

- Add a "Subscription ended" state to the status labels, and show those shops with the paid group's history rather than inside Expired Trials.

## Technical notes

- New edge function `cancel-subscription`: authenticate the caller, confirm they are owner/admin of the organization, find the org's Stripe subscription via admin emails (same lookup as `suspend-subscription`), set `cancel_at_period_end: true`, store the period end on the `subscribers` rows, and set `organizations.subscription_status = 'canceling'`. Resume reuses the existing `unsuspend-subscription` logic path (`cancel_at_period_end: false`) or a small `resume` flag on the same function.
- `check-subscription`: in the fallback branch, only write `level: 'trial'` when the org has never had a paid level; otherwise keep `subscription_level` and set `subscription_status = 'ended'`. Return the existing tier plus an `expired_reason` (`trial` or `subscription`) so the UI can word the banner.
- `src/utils/subscription-status.ts`: add `canceling` and `subscription_ended` to `OrgStatus` / `getStatusLabel`, driving both super admin grouping and the Settings badge.
- `src/components/settings/SubscriptionSettingsTab.tsx`: cancel/resume buttons behind the existing `canManageSubscription` check, AlertDialog confirmation, expired banner, and `refreshSubscription()` after each action.
- `src/components/superadmin/SubscriptionManagement.tsx` and `OrganizationCard.tsx`: use the new labels; keep Suspend / Un-suspend as they are.
- No database migration needed — `organizations.subscription_status`, `subscribers.subscription_end` and `subscribers.subscribed` already carry the states.
