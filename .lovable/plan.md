# Cancel subscription does nothing — cause and fix

## What's actually wrong

The cancel action calls a server routine named `cancel-subscription`. Verified just now: that routine has **never been deployed** — calling it returns "function not found", and it has no logs at all. So every click fails instantly on the server side, and the app only writes a message to the browser's hidden console, which is why it looks like nothing happens.

## Fix

1. **Deploy the cancel routine** so the request reaches Stripe. Its code already exists and is complete (it sets the Stripe subscription to stop at period end, marks the shop as "cancelling", and stores the end date).
2. **Show a clear loading state.** After confirming, the confirm button reads "Cancelling…" with a spinner, both dialog buttons are disabled, and the dialog stays open until Stripe replies — then it closes and the notice with the end date appears.
3. **Show real failures to the user.** If the request fails, keep the dialog open and display the actual reason (for example "no active subscription was found") instead of a silent console message. Also treat a "nothing changed" reply as a warning rather than a success.

## Technical notes

- Deploy `supabase/functions/cancel-subscription` (config entry in `supabase/config.toml` already exists; `verify_jwt = true` is correct since the function reads the caller's token).
- `src/components/settings/SubscriptionSettingsTab.tsx`: keep `cancelDialogOpen` open while `cancelWorking`; add `Loader2` spinner + "Cancelling…" label on `AlertDialogAction`; on error surface `error.message`; when `result.changed === false`, show `toast.warning(result.message)` and leave state unchanged.
- No database migration needed; no change to `cancel-subscription/index.ts` logic.
- After deploy, verify the function responds and that a cancel writes `organizations.subscription_status = 'canceling'` plus `subscribers.subscription_end`.
