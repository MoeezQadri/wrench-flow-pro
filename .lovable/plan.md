# Super admin data freshness, sorting, trial expiry — and tracking check

## What I checked and found

**1. Latest data reflected?**
The super admin screen loads everything once when it opens, and only reloads after you create or delete an organization, or change a subscription. There is no refresh button and nothing re-reads while the tab stays open, so a signup that happens while you are looking at it will not appear until you reload the page.

**2. Sorting by date**
There is no sorting control anywhere on the super admin screens. Organizations arrive newest-first from the server and are shown as cards in that fixed order; the search box filters by name and email only. So there is currently nothing to sort with.

**3. Expired trials**
You are right that expired trials exist — they just are not stored anywhere. The app decides trial expiry **live**, in the subscription check: trial ends 14 days after the organization was created. Nothing is written back, so no table holds a trial end date (the `trial_ends_at` field is empty on all 40 organizations, and the subscribers table has no end date for trials either). That is why the app front-end correctly treats trials as expired while the super admin screen shows nothing.

The super admin screen instead reads the stored `trial_ends_at` field, which is always empty — so the "Expired Trials" section is always empty and every organization keeps showing "trial / active".

By the app's own 14-day rule, **39 of the 40 organizations are past their trial** and 1 is still inside it.


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

