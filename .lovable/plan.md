# Add a Delete option for expenses (owner/admin)

## What we found

- The permission rules already allow owner, admin, and manager to delete expenses, but there is no Delete button anywhere — the delete function exists in code and is never called, so today nobody can delete an expense.
- Every expense automatically creates a linked bill in Payable Management. The database is set so deleting an expense also deletes its bill, including any partial-payment history on that bill.
- Deleting an expense removes it from the Expenses report, the Financial report, and dashboard expense figures. If the expense was a job cost linked to an invoice, the invoice itself is untouched but its profit goes up. Deleting a part-purchase expense does NOT reduce part stock.

## The change

Add a Delete action to the Expenses page, visible only to owner and admin (not manager, keeping this to the top two roles):

- A trash icon next to Edit / Mark as Paid on each expense row.
- Clicking it opens a confirmation dialog naming the expense (date, category, amount, vendor) and warning clearly: "This will also remove the linked bill and any payment history recorded against it. This cannot be undone."
- On confirm, the expense is deleted using the existing `removeExpense` function; the database automatically removes the linked bill. The expense disappears from everywhere it appears: the Expenses page (both workshop and invoice expenses), Payable Management — including paid (cash-out) records and any payment history on its bill — all reports (Expenses, Financial, dashboard figures), and the vendor's details (what you owe them and their payment history). The expense list and bills reload so every screen reflects the removal immediately.
- If the expense is linked to an invoice whose work is complete or paid, deletion is not allowed — the Delete action is hidden (or refused with a clear message) for those expenses, since the cost is part of a finished job's accounts. For expenses on open or in-progress invoices, the invoice itself and its lines are untouched — only the cost is removed, so profit on that job goes up. Part stock quantities are never changed.
- On failure, an error message is shown and nothing is removed.

## What stays the same

- No database changes — the existing delete permission rules and the automatic bill removal already handle this.
- Edit and Mark as Paid behave exactly as today.
- Invoices, parts, and stock quantities are never touched by an expense delete.

## Technical notes

- `src/pages/Expenses.tsx`: add `userCanDeleteExpenses = hasPermission(currentUser, 'expenses', 'delete') && ['owner','admin'].includes(currentUser.role)`; add an `AlertDialog` holding the expense pending deletion; call `removeExpense` from context, then `Promise.all([loadExpenses(), loadPayables()])`.
- No migration needed; existing expenses RLS delete policy already scopes by organization.
