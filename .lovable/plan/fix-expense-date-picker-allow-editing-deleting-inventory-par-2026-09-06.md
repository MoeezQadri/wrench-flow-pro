# Fix expense date picker + allow editing/deleting inventory parts

## 1. Expense date picker

The date button on the expense form (used for both workshop and invoice expenses) is inside the form and has no button type, so clicking it is treated as a form submit instead of opening the calendar. The calendar panel also needs the same click-through fix used elsewhere in the app when it appears above a dialog.

Fix:
- Make the date button a plain button so it only opens the calendar.
- Add the same calendar styling/click fix used by the dashboard date pickers.
- Keep the existing rule that future dates can't be picked.

## 2. Edit and delete parts in inventory

Only Owner and Admin get these two actions; everyone else sees the list exactly as today.

Edit:
- Each part card (grid and list view) gets an Edit action that opens the existing part dialog pre-filled with that part.
- Saving updates the part in place — name, part number, description, quantity, cost, price, vendor.
- Editing never creates a duplicate purchase expense (that only happens when a part is first added).

Delete:
- Each part card gets a Delete action, guarded by a confirmation dialog naming the part.
- Safety rails: if the part is used on any invoice or estimate line, deletion is blocked with a clear message telling the user how many documents use it, and suggesting setting quantity to 0 instead. Only unused parts can be removed.
- After a successful delete the inventory list refreshes and a confirmation toast appears.

## Technical notes

- `src/components/expense/ExpenseForm.tsx`: add `type="button"` to the popover trigger button; add `className="p-3 pointer-events-auto"` to `Calendar`.
- `src/pages/Parts.tsx`: add `editingPart` state + `AlertDialog` for delete; compute `canEditParts` / `canDeleteParts` from `currentUser.role` in `['owner','admin']` (superadmin included via `isSuperAdmin`); render Edit/Delete buttons alongside the existing Assign button in both view modes; on save route to `updatePart` when `editingPart` is set, otherwise `addPart`.
- `src/components/part/PartDialog.tsx`: already supports a `part` prop and skips expense creation when editing — pass the part through; no schema change.
- New dependency check in `src/context/data/hooks/useParts.ts`: `getPartDependencies(id)` counting `invoice_items` rows with `part_id = id` (grouped by invoice), exposed through `DataContextType.ts` and `DataContext.tsx`, and used by `removePart` to refuse deletion when count > 0.
- No database migration needed; existing parts RLS policies already scope by organization and the delete/update paths run under the signed-in user.
