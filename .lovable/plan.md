# Fix: Automation Setup tab hidden for owner-bypass accounts

## Root cause
`Settings.tsx` and `AutomationSetupTab.tsx` decide who sees the Automation Setup UI by reading `organization.subscription_level` from the `organizations` table. That column is only written by the Stripe webhook after a real paid checkout. The hardcoded `OWNER_EMAILS` bypass (and any org still on trial that `check-subscription` upgrades at runtime) never updates that column, so `subscription_level` stays `'trial'` and the tab is hidden — even though `check-subscription` returns `subscription_tier: 'Enterprise'`.

This affects every owner-bypass account and any normal owner whose org hasn't been upgraded through the Stripe webhook.

## Fix
Use the live values already exposed by `AuthContext` (`subscribed`, `subscriptionTier`) as the source of truth for tier-gating, falling back to `organization.subscription_level` only when they're unavailable.

### Changes

1. `src/pages/Settings.tsx`
   - Pull `subscriptionTier` from `useAuthContext()`.
   - Compute effective plan as: `subscriptionTier` (lowercased) if `subscribed`, else `organization.subscription_level`.
   - Use that value for `showAutomationTab`.

2. `src/components/settings/AutomationSetupTab.tsx`
   - Same change: derive `plan` / `isEnterprise` from `subscribed && subscriptionTier`, with the org column as fallback.
   - Keeps the "Enterprise-only" item filtering correct for bypass accounts (which are Enterprise).

No DB or edge-function changes — the runtime bypass in `check-subscription` already reports Enterprise correctly; we just need the UI to trust it.

## Verification
- Load `/settings` as an `OWNER_EMAILS` account whose org is still `trial` in the DB → Automation Setup tab visible, all items (including Enterprise-only) available.
- Load as a normal member of a trial org → tab hidden (unchanged).
- Load as a paid Professional org (webhook-updated) → tab visible, Enterprise-only items disabled (unchanged).
