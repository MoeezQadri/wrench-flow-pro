# Preserve Selected Dates Across the App

## Goal
Ensure every date chosen by a user is saved and shown as that same calendar date, regardless of browser, server, or organization timezone.

## Confirmed findings
- Expense saving currently converts the selected calendar value with `toISOString()` and truncates it. This can shift the chosen day in timezones ahead of UTC.
- Editing an expense reconstructs a date-only value with `new Date(...)`, which interprets it as UTC and can display the previous day in some timezones.
- Recent expenses for the Karachi organization are stored at UTC midnight, while invoice records use a separate organization-timezone conversion. The flows are inconsistent.
- Invoice creation and editing already use an organization-aware helper, but other selected-date flows still use direct `Date`, `toISOString()`, and `parseISO()` conversions.
- The date columns involved are timestamps, so this can be corrected in application date normalization without changing the database schema.

## Plan
1. **Create one calendar-date contract**
   - Extend the shared organization date utilities with safe helpers for converting a date picker value or `YYYY-MM-DD` string into a stable organization-local calendar day.
   - Keep exact timestamps for true time events, while treating user-selected business dates as date-only values anchored safely in the organization's timezone.

2. **Fix expense create and edit**
   - Save workshop and invoice-related expense dates through the shared organization-aware conversion instead of UTC truncation.
   - Parse saved expense dates back into the picker without allowing the browser timezone to move the day.
   - Display expense dates using the same organization-aware formatter.

3. **Standardize invoice and estimate dates**
   - Verify create and update both use the same selected-day conversion.
   - Normalize the invoice/estimate picker value so reopening a document shows the exact selected date.
   - Keep due-date comparisons and displays aligned with the organization's calendar day.

4. **Audit every other user-selected date**
   - Apply the same rule to payment dates, attendance dates, leave start/end dates, payable payment dates, and report/date-range controls.
   - Do not alter system-generated timestamps such as creation time, update time, login time, or subscription event time.

5. **Protect reporting and filtering**
   - Replace browser-local parsing where it can shift selected boundaries or displayed dates.
   - Ensure daily/monthly expense totals, invoice reports, attendance reports, exports, overdue checks, and date-range filters classify records under the intended organization date.

6. **Verify representative timezone cases**
   - Test dates in both UTC-positive and UTC-negative zones, including month/year boundaries.
   - Confirm create, refresh, edit, lists, reports, and CSV output retain the selected day.
   - Run project checks and inspect the latest preview errors.

## Technical boundary
- No database schema or existing-record rewrite is planned.
- Timestamp columns remain unchanged; only user-selected calendar dates are normalized consistently.
- Historical records will be displayed according to their stored timestamp and organization timezone. Any ambiguous historical rows will not be shifted automatically without a separate data-correction review.
