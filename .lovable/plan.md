# Complete the Technician Label Update

## Goal
Finish changing every user-visible **Mechanic/Mechanics** label to **Technician/Technicians**, while preserving all existing data, permissions, links, and behavior.

## Correct the partial update
- Restore accidentally renamed internal form fields, variables, and references to their existing mechanic-based names.
- Restore both sidebar destinations to `/mechanics`; only their displayed title remains **Technicians**.
- Fix the current compile errors across technician listing, task assignment, attendance, invoice labor assignment, and performance screens.

## Finish visible wording
- Replace remaining visible mechanic wording in buttons, descriptions, validation messages, task/invoice assignment help, attendance messages, reports, debug screens, and fallback names.
- Keep singular/plural wording and capitalization natural in each location.
- Keep the stored role value `mechanic`, but display it as **Technician** in role and user-management controls.

## Technical boundary
- Do not rename the `mechanics` table, `mechanic_id` fields, TypeScript models, API functions, permission resource keys, or stored role values.
- Do not change `/mechanics` routes or navigation destinations.
- Do not alter technician records, task assignments, attendance data, reports, or permissions.

## Verification
- Run the project checks until the current compile errors are cleared.
- Scan interface strings for any remaining user-visible **Mechanic/Mechanics** labels.
- Verify navigation and representative Technicians, Tasks, Attendance, Invoice, Reports, Dashboard, Help, and User Management screens.
