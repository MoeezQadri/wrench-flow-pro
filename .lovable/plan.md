## Fix subscription expiration check

Update `supabase/functions/check-subscription/index.ts` so cached `subscribers` rows are only trusted while still active.

### Change

In the fast-path lookup (org-scoped `subscribers` query), require `subscription_end > now()` in addition to `subscribed = true`. If the cached row is expired, fall through to the Stripe API check (which will return the real state and update the cache), instead of returning stale `subscribed: true`.

### Technical detail

- Add a timestamp comparison: treat cached row as valid only if `subscription_end` is null-or-future AND `subscribed = true`.
- When expired, continue to the existing Stripe branch so the webhook/live check refreshes the cache and downgrades the org if needed.
- No schema changes. No frontend changes.

### Verification

After the fix, call `check-subscription` for a user whose `subscribers.subscription_end` is in the past — it should now return `subscribed: false` instead of the cached `true`.