# Super admin data freshness, sorting, trial expiry — and tracking check

## What I checked and found

**1. Latest data reflected?**
The super admin screen loads everything once when it opens, and only reloads after you create or delete an organization, or change a subscription. There is no refresh button and nothing re-reads while the tab stays open, so a signup that happens while you are looking at it will not appear until you reload the page.

**2. Sorting by date**
There is no sorting control anywhere on the super admin screens. Organizations arrive newest-first from the server and are shown as cards in that fixed order; the search box filters by name and email only. So there is currently nothing to sort with.

**3. Expired trials — and how lockout actually works today**
Trial status is never stored. It is decided live, every time someone uses the app, in this order:

1. Two hard-coded owner email addresses always get full access.
2. A paid subscription is looked up — first from the cached `subscribers` row for that organization (used only while its end date is still in the future), otherwise checked directly against Stripe for the organization's owner/admin emails, which also refreshes the cache.
3. Only if there is no subscription at all does it fall back to a trial: **14 days from the organization's creation date**.

So a paying organization is never judged by the trial date — the subscription wins. Nothing is written back to the organization row: `trial_ends_at` is empty on all 40 organizations, `subscription_level` says "trial" and `subscription_status` says "active" for every one of them, and the subscribers table holds exactly one paid row (Basic, ending 13 Sep 2026).

The super admin screen reads those stale stored fields, which is why the Expired Trials list is always empty and everything shows "trial / active".

Counting the same way the app does: 1 organization has a live paid subscription, 38 have no subscription and are past their 14 days, 1 has no subscription and is still inside its trial.



**4. GA and Google Ads events for login / signup**
Events exist and the tags do fire — I loaded the sign-in page in a browser and confirmed both Google Analytics and Google Ads sent data.

- **login** — sent to Google Analytics on the sign-in page, only after a *successful* sign-in. Failed attempts send nothing (correct).
- **sign_up** — sent to Google Analytics on the sign-up page when registration completes successfully, together with the Google Ads "Signup" conversion.
- Plan viewed / plan selected, purchase (thank-you page) and cancellation are also wired, plus the Ads "Subscribe page visit" and "Subscribe" conversions.

I could not fire a real login/sign-up event in testing without using a real account, so those two are verified as correctly wired rather than observed end-to-end. If you want, I can run one real sign-in with a throwaway account and confirm the hit.

## Proposed work

### A. Fresh data on the super admin screen
- Add a **Refresh** button in the header, with a "last updated" timestamp.


### B. Sorting
- Add a sort control above the organization list: **Newest / Oldest (created)**, **Trial end date**, **Last login**, **Name (A–Z)**.
- Apply the same sort to the Users tab where the same columns exist (created, last login, name).

### C. Trial and subscription status shown truthfully
The super admin must judge each organization exactly the way the app does, in the same order, so a paying customer is never shown as an expired trial:

- **Paid** — has a live subscription (an unexpired cached subscriber row, or a live Stripe subscription). Shown as its plan name with the renewal date. Trial dates never apply.
- **Trial active** — no subscription, still inside 14 days of creation. Shown as "Trial — N days left".
- **Trial expired** — no subscription, past 14 days. Shown as "Trial expired N days ago" and listed under Expired Trials.
- The two hard-coded owner accounts are shown as **Internal / full access** so they are not miscounted.

To make this reliable rather than guessed, the subscription check gets a small addition: whenever it decides an organization's state it writes that state back onto the organization row (plan level, active/trial/expired, and the trial or renewal end date). The super admin then reads real, current values instead of recomputing anything, and the numbers can never disagree with what the customer sees.

For the existing 40 organizations I will do a one-time correction using the same rules: the one paid organization keeps its plan and renewal date, and the rest get a trial end date of creation + 14 days with the matching status.

Add an **Expired Trials** count tile alongside the existing summary tiles, and make the Expired Trials list populate.

I will not add a harder lockout — the existing subscription check already restricts the app once a trial ends. Tell me if you want expired organizations blocked more aggressively.

## Technical notes

- Trial length is `TRIAL_DAYS = 14` in `supabase/functions/check-subscription/index.ts`, computed from `organizations.created_at`. That function stays the single source of truth for status; the super admin never re-derives it.
- `check-subscription`: after each decision, update `organizations` with `subscription_level`, `subscription_status` (`active` | `trialing` | `expired`), and `trial_ends_at` (trial end, or subscription period end for paid orgs). Best-effort write wrapped in try/catch so a failed write never breaks the response.
- `src/pages/superadmin/SuperAdminDashboard.tsx`: refresh button + `lastUpdatedAt` state; sort state applied to `filteredOrganizations` and passed to the users tab.
- Shared helper (e.g. `src/utils/subscription-status.ts`) `getOrgStatus(org, subscriberRow)` → `internal | paid | trial_active | trial_expired`, precedence subscription-before-trial; used by `OrganizationCard.tsx`, `SubscriptionManagement.tsx`, `getTrialOrganizations`, `getExpiredTrials` and `getPaidSubscriptions` so no org appears in two buckets. The super admin already loads `getAllSubscriptions()`, so the paid check needs no extra request.
- `supabase/functions/register-organization/index.ts`: add `trial_ends_at: now + 14 days` and `subscription_status: 'trialing'` to the organizations insert.
- Migration: default `organizations.trial_ends_at` to `now() + interval '14 days'`. Separate one-time data update for the 40 existing rows (trial end = `created_at + interval '14 days'`, status by rule; the paid org set from its subscriber row).
- `organizations_with_profiles` already exposes `trial_ends_at`, `subscription_level`, `subscription_status` and `created_at`, newest-first, so sorting stays client-side.
- No tracking code changes needed unless you want extra events.


