# Delete invoices (Owner / Admin)

Add a guarded delete action for invoices and estimates, and fix the problems the existing delete logic would cause.

## What you'll get

- A **Delete** action on each row of the Invoices list and in the header of an invoice/estimate detail page.
- Visible only to Owner and Admin. Everyone else never sees the option, and the delete is also blocked server-side by organization scoping.
- A confirmation dialog that names the invoice, the customer, and the total, and warns that it cannot be undone.
- Clear blocks instead of silent failures: an invoice that already has payments recorded cannot be deleted until the payments are removed, and linked work orders are handled explicitly.

## Issues found that need resolving

1. **Delete logic exists but is not reachable.** `removeInvoice` is already wired into the data context, but no screen calls it — so today invoices simply cannot be deleted.
2. **Linked tasks block the delete.** 19 invoices have work orders pointing at them, and the database refuses to delete an invoice while a task references it. The delete will fail with a foreign-key error unless the tasks are unlinked first.
3. **Inventory would be restored incorrectly.** The current logic adds every part line back to stock. Estimates and declined estimates never deducted stock, so deleting one would inflate inventory. Only invoices that actually moved stock may restore it.
4. **Purchase expenses are left behind.** 8 invoices have vendor expenses created from their part lines. Deleting the invoice leaves those expenses (and the vendor dues they feed) with no source document.
5. **Failures are swallowed.** Errors deleting payments or line items are only logged; the code then continues, which can leave a half-deleted invoice. 17 invoices are paid or partially paid, so this matters.
6. **Role matrix mismatch.** Invoice delete currently allows Manager as well. Per your request the action will be Owner/Admin only, and the matrix will be tightened to match.

## Behaviour rules

- **Estimate / declined**: delete freely — no stock or expense side effects to undo.
- **Open invoice, no payments**: delete, restoring stock for part lines, removing its line items, unlinking its work orders (tasks stay, they just lose the invoice link), and removing the purchase expenses that the invoice itself created.
- **Paid / partial invoice**: blocked, with a message telling you to remove the payments first (this protects your revenue reports).
- Every step runs in order and any failure aborts with a real error message instead of a partial delete.
- The list, dashboard, and finance figures refresh after a successful delete.

## Technical notes

- Rewrite `removeInvoice` in `src/context/data/hooks/useInvoices.ts` into a service function (`deleteInvoiceOptimized` in `src/services/optimized-invoice-service.ts`) that: guards on payment existence, skips stock restore when status is `estimate`/`declined`, restores part quantities and strips the invoice id from `parts.invoice_ids`, nulls `tasks.invoice_id` for linked tasks, deletes `expenses` rows whose `invoice_id` matches, then deletes `invoice_items`, `payments`, and finally the invoice. Throw on every error.
- Reuse the existing non-stock-status helper so delete matches the create/update path.
- UI: `PermissionGuard resource="invoices" action="delete"` around a destructive menu item in `src/pages/Invoices.tsx` rows and `src/pages/InvoiceDetails.tsx` header, with a shadcn `AlertDialog` confirmation; navigate back to `/invoices` after deleting from the detail page.
- `src/utils/permissions.ts`: change the `invoices` `delete` rule to `['owner', 'admin']`.
- No schema migration is required — organization-scoped delete policies already exist on `invoices`, `invoice_items`, and `payments`, and items/payments cascade.
- Verify with `tsgo --noEmit` and the build log. Note: this project uses your own external Supabase, so I cannot run a signed-in browser test here; the delete flow will need a quick check in the preview.
