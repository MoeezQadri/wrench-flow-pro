# Relabel Mechanics as Technicians

## Goal
Change every user-visible reference from **Mechanic/Mechanics** to **Technician/Technicians** throughout the app without changing how existing data works.

## Changes
- Update navigation, page titles, headings, descriptions, buttons, dialogs, confirmations, notifications, filters, dropdown labels, empty states, reports, attendance screens, task assignment screens, help text, and role labels.
- Preserve correct singular/plural wording and capitalization in each location.
- Keep the underlying role value as `mechanic`, while displaying it as **Technician** in user-management forms and lists.
- Review all remaining visible text after the replacements so no old label remains.

## Technical boundary
- Keep the existing `mechanics` database table and `mechanic_id` fields unchanged.
- Keep internal code names, permission keys, and API contracts unchanged.
- Keep `/mechanics` URLs unchanged, so existing links and bookmarks continue working.
- Do not alter existing technician records, assignments, attendance, tasks, permissions, or reports.

## Verification
- Check the main navigation, Technicians page, add/edit forms, tasks, invoices, attendance, reports, dashboard, user management, and help screens.
- Confirm dropdown values and permissions still work after their displayed labels change.
- Run the project checks and scan the interface source for any remaining user-visible “Mechanic” wording.
