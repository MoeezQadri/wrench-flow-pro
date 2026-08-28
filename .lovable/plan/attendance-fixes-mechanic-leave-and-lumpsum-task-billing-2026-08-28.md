# Attendance fixes, mechanic leave, and lumpsum task billing

## 1. "Unknown Mechanic" in attendance

Cause: the Attendance page only loads attendance records on entry (`loadData` calls `loadAttendance()` alone), so if the Mechanics page hasn't been visited, the mechanics list is empty and each row falls back to "Unknown Mechanic".

Fix: load mechanics alongside attendance on the Attendance page, and only show "Unknown Mechanic" when mechanics have finished loading and no match exists (otherwise show a neutral placeholder). Same guard for the mechanic filter dropdown so it isn't empty.

## 2. Mechanic leave (inside Attendance)

Leave lives in the attendance system, as chosen.

- New leave entry: "Add Leave" button next to "Check In" on the Attendance page. Form: mechanic, leave type (annual, sick, unpaid, other), start date, end date, notes.
- One attendance row is created per leave day, marked as a leave record with status `pending`, and no check-in/check-out times.
- Approvers (owner, manager, foreman) approve or reject leave from the same list using the existing approve/reject buttons; leave rows show a distinct badge, the leave type, and the date range instead of working hours.
- Filters gain a "Leave" status option; the summary card gains a "Leave days" count and excludes leave rows from working-hour totals.

Database: add `record_type` (`attendance` | `leave`, default `attendance`), `leave_type`, and `leave_end_date` to the `attendance` table, make `check_in` nullable for leave rows, and extend the status enum with `leave` handling as needed. Existing rows stay untouched as regular attendance.

## 3. Lumpsum (flat-fee) billing for invoice tasks

Today a labor line is priced as rate x hours, and the synced task stores hours + labor rate. Add an explicit billing mode.

- Invoice item form (labor): a "Billing" toggle — "Hourly" (current: rate x hours) or "Lumpsum" (enter one flat amount; quantity fixed at 1, amount shown as the line total).
- Task form: same billing mode for tasks of type "invoice" — Lumpsum shows a single price field, and estimated/spent hours stay editable for reporting (hours are tracked but never used to compute the charge).
- The labor-to-task sync keeps working: lumpsum lines write the flat price to the task, keep the mechanic's logged hours, and leave `labor_rate` empty. Repeat saves still update the same task via the stored `task_id`, so no duplicates.
- Invoice display and reports show the flat amount as-is; hourly lines are unchanged. Mechanic performance keeps using logged hours, so lumpsum work still counts toward utilization.

Database: add `billing_type` (`hourly` | `lumpsum`, default `hourly`) to `tasks`, and record the same flag in the invoice item's labor data so edits round-trip correctly.

## Technical notes

- Files touched: `src/pages/Attendance.tsx`, `src/components/attendance/*` (new `LeaveDialog`/`LeaveForm`, `AttendanceListItem`, `AttendanceFilters`, `AttendanceSummary`), `src/context/data/hooks/useAttendance.ts`, `src/components/invoice/InvoiceItemForm.tsx`, `src/components/task/TaskForm.tsx`, `src/services/optimized-invoice-service.ts`, `src/services/invoice-service.ts`, `src/types/index.ts`.
- Two migrations (attendance leave columns; tasks billing_type), each with grants preserved and existing RLS policies untouched; `organization_id` continues to come from the existing insert trigger.
