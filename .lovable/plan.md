# Super Admin dates: one rule (UTC, "24 Sep 2026")

## What happens today
In Super Admin, every date shows in the time zone of whoever is viewing it. The date styles are also mixed: "Thu Sep 24 2026" in one place and "9/24/2026" in another. So a signup near midnight can show a different day to different people.

## Changes
- All Super Admin dates and times show in UTC, marked "UTC". Dates look like "24 Sep 2026" and times like "24 Sep 2026, 12:29 UTC".
- This covers:
  - organization created (signup) dates, on the cards and in the subscription table
  - trial end, renewal and "access until" dates, including the suspend confirmation and the status text
  - the "Updated" time on the dashboard
  - "Last updated" on analytics scripts
- Date sorting still uses the exact moment, so the order of the lists doesn't change.
- The shop side of the app is not changed: shops keep seeing dates in their own shop time zone, as they do now.
- No saved data changes. Dates are already stored in UTC.

## Technical details
- Add `formatUtcDate` / `formatUtcDateTime` in `src/utils/datetime.ts` using `Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })`.
- Replace `toDateString`/`toLocaleDateString`/`toLocaleString`/`toLocaleTimeString` in `SubscriptionManagement.tsx` (221, 332, 514), `OrganizationCard.tsx` (116, 125), `SuperAdminDashboard.tsx` (274), and `SuperAdminAnalytics.tsx` (255).
- `subscription-status.ts` (112, 118, 127) is also used by the shop side. Add an optional formatter argument: Super Admin passes the UTC formatter, and shop screens keep the shop-time-zone date.
- Verify: tsgo, build, and a check that a timestamp like 2026-09-24T22:30Z shows as "24 Sep 2026" whatever the viewer's time zone.
