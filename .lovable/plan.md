## Problem

`OWNER_EMAILS` bypass in `supabase/functions/check-subscription/index.ts` only fires when the caller's own email is in the list. Invited sub-users in the same organization don't match, so they:

1. Skip the bypass block.
2. Find no `subscribers` row for the org (owner uses bypass and never wrote one).
3. Find no active Stripe subscription for any admin email (owners are bypass-only, not paid in Stripe).
4. Fall back to the 14-day trial from org `created_at` — which for older orgs is expired, so they see "not subscribed".

## Fix

Extend the bypass so it applies **org-wide**, not just for the caller.

In `supabase/functions/check-subscription/index.ts`, after resolving `organizationId` (around line 109), before the fast-path subscribers lookup:

1. Query `profiles` for all `owner`/`admin` rows in the org.
2. Resolve their emails via `supabaseClient.auth.admin.getUserById(id)`.
3. If any of those emails is in `OWNER_EMAILS`, return the same Enterprise payload the caller-bypass path returns.

The existing admin-candidate resolution later in the function already does this lookup — we just need to do the email resolution once, earlier, and short-circuit on an owner-bypass hit. Then reuse the same `candidates` array for the Stripe loop below to avoid a second round of `getUserById` calls.

No schema changes, no frontend changes. Single edge function edit; deploys automatically.

## Verification

- Log in as an invited sub-user whose org owner is `gearheadgarage.pk@gmail.com` or `daniyal.reviewer@gmail.com` → subscription resolves to Enterprise.
- Log in as an unrelated org's user → still hits trial/Stripe path unchanged.
- Check edge function logs for a new `Org owner is bypass account, granting Enterprise access` line.
