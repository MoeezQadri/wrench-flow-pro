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

### C. Trial dates and expiry status
- Use the same rule the app already uses — **trial ends 14 days after the organization was created** — so the super admin matches what customers actually experience. No guessing, no second source of truth.
- Store that date going forward: write a trial end date when an organization is created, and fill it in for the 40 existing organizations as creation date + 14 days, so the dates are visible and sortable.
- Label trial state from the date rather than the stored "active" word: **Trial (N days left)** or **Trial expired N days ago**. Paid organizations are unaffected.
- Add an **Expired Trials** count tile to the summary cards, and make the existing Expired Trials list populate correctly.

I will not automatically lock expired-trial organizations out of the app as part of this — the subscription check already blocks paid features when the trial is over. Tell me if you want a harder lockout.

## Technical notes

- Trial length lives in `supabase/functions/check-subscription/index.ts` as `TRIAL_DAYS = 14`, computed from `organizations.created_at`. Everything below reuses 14 days so there is one rule.
- `src/pages/superadmin/SuperAdminDashboard.tsx`: refresh button + `lastUpdatedAt` state; sort state applied to `filteredOrganizations` and passed to the users tab.
- Shared helper `getTrialState(org)` → `paid | trial_active | trial_expired`, based on `trial_ends_at ?? created_at + 14 days`; used by `OrganizationCard.tsx`, `SubscriptionManagement.tsx`, `getTrialOrganizations` and `getExpiredTrials` so an org cannot appear in both lists.
- `supabase/functions/register-organization/index.ts`: add `trial_ends_at: now + 14 days` to the organizations insert.
- Migration: default `organizations.trial_ends_at` to `now() + interval '14 days'`; data update sets `trial_ends_at = created_at + interval '14 days'` where it is null.
- `organizations_with_profiles` already exposes `trial_ends_at`, `subscription_level`, `subscription_status` and `created_at`, and returns newest-first, so sorting stays client-side.
- No tracking code changes needed unless you want extra events.

