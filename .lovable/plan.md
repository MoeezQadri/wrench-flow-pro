
# Align Subscription Enforcement with New Pricing Tiers

The pricing cards advertise Free 1 / Basic 3 / Professional 10 / Enterprise 50 users, but enforcement uses different numbers in two places. Align both to the advertised tiers and their feature promises.

## New canonical limits

| Tier | Users | Invoices | Customers | Vehicles | Reports | Automation (SMS/Email/Reminders/Reviews) | Reactivation/Booking/Branding |
|---|---|---|---|---|---|---|---|
| Free (trial) | 1 | 50 | 25 | 25 | all features unlocked during 14-day trial | yes | yes |
| Basic | 3 | 500 | 200 | 200 | yes | no | no |
| Professional | 10 | 2000 | 1000 | 1000 | yes | yes | no |
| Enterprise | 50 | unlimited | unlimited | unlimited | yes | yes | yes |

Note: Free is trial-only and time-boxed by existing trial logic — during the 14-day window it behaves like Enterprise for feature gating.

## Changes

1. **`src/hooks/useSubscriptionLimits.ts`**
   - Update `maxUsers` / `maxInvoices` / `maxCustomers` / `maxVehicles` for each tier per table above.
   - Expand `features` map to: `reports`, `analytics`, `automatedReminders`, `smsEmailDelivery`, `reviewRequests`, `reactivationCampaigns`, `bookingForm`, `customBranding`, `api`.
   - Trial: all features true (14-day full access).
   - Basic: reports + analytics only.
   - Professional: adds `automatedReminders`, `smsEmailDelivery`, `reviewRequests`.
   - Enterprise: everything true.
   - Default fallback: mirror Basic-minus (safe minimum).

2. **`src/utils/global-data.ts`**
   - Rewrite `USERS_ALLOWED_IN_PLAN` to `{ Trial: 1, Basic: 3, Professional: 10, Enterprise: 50 }` (keys matching `subscription_level` casing used elsewhere — verify lowercase vs capitalized while editing and normalize the lookup in `InviteUserDialog.tsx` accordingly).

3. **`src/components/admin/InviteUserDialog.tsx`**
   - Normalize `org.subscription_level` to the map's key casing before lookup so the cap resolves for trial/basic/professional/enterprise regardless of stored case.

No DB, RLS, or Stripe changes — Stripe prices already come from `subscription_plans` rows; this only aligns client-side gating with the marketed tiers.
