# Cancelled subscriptions: clear end date, no re-cancel, and super admin visibility

## What the shop owner sees

After pressing Cancel and confirming:

- The Cancel button disappears and does not come back on refresh — the shop is marked as cancelling in the database, so the state survives reloads and sign-outs.
- In its place, a clear notice: "Your subscription ends on <date>. You keep full access until then." The status badge reads "Cancelling" and the date row reads "Access until".
- The Resume button is removed as well, per the request: once cancelled, the only way back is choosing a plan again. (Say the word if you would rather keep a Resume option during the paid-up window — Stripe supports it and the groundwork is already there.)

## Turning access off on the end date

Today the switch-off only happens the next time somebody from that shop opens the app, and only because a live Stripe check finds no subscription. Two changes make it reliable:

- The Stripe notification handler will also act on subscription-ended notifications: it marks the shop's subscription as ended right away, so access is cut on the correct date without waiting for anyone to log in.
- The subscription check will also treat a cancelling shop whose end date has passed as ended, as a safety net. From that moment the shop is locked to Settings only, exactly like an expired trial, with its data untouched.

## Super admin

- New section "Cancelled by customer", listing each shop with its plan and "Access until <date>" — so you can see who has cancelled and when they lapse. These shops leave the Paid section.
- Once the date passes, the shop moves into the expired section, which is renamed "Expired Trials & Ended Subscriptions" and shows either "Trial expired N days ago" or "<Plan> — subscription ended". Its count includes both.

## Technical notes

- `src/components/settings/SubscriptionSettingsTab.tsx`: when `subscriptionCanceling`, render an informational panel with the `subscriptionEnd` date and render neither Cancel nor Resume. Cancel button shown only when `subscribed && isPaidPlan && !subscriptionCanceling && canManageSubscription`. Drop `handleResumeSubscription`.
- `supabase/functions/stripe-webhook/index.ts`: stop early-returning on every non-`checkout.session.completed` event. Add handling for `customer.subscription.deleted` (and `customer.subscription.updated` when `status` is `canceled`/`unpaid`): resolve the org from the Stripe customer email via `profiles`/`subscribers`, then set `organizations.subscription_status = 'ended'` (keeping `subscription_level`) and `subscribers.subscribed = false`, `subscription_end = period end`.
- `supabase/functions/check-subscription/index.ts`: in the cached branch, when `storedStatus === 'canceling'` and `subscription_end` is in the past, return `subscribed: false`, `status: 'ended'`, `expired_reason: 'subscription'` and persist that, instead of reporting the plan as live.
- `src/components/superadmin/SubscriptionManagement.tsx`: remove `canceling` and `subscription_ended` from `getPaidSubscriptions()`; add `getCancelingSubscriptions()` and a new `CollapsibleCard`; include `subscription_ended` in the expired card and retitle it. Labels come from the existing `getStatusLabel` in `src/utils/subscription-status.ts` (no changes needed there).
- No database migration required — `organizations.subscription_status`, `subscribers.subscription_end` and `subscribers.subscribed` already carry these states.
