# Work Orders, then Invoices: new names and editing rules

## How it will work
```text
Estimate ──convert──> Work Order ──────────────────────> Invoice
(editable)            Approved                           Payment pending
                      Work in progress                   Partial payment
                      Completed  ───(becomes)──────────> Payment completed (closed)
```
- **New:** create an Estimate, or go straight to a Work Order.
- **Estimate to Work Order:** a "Convert to work order" button. It becomes Approved and stays fully editable. Declined estimates stay as they are.
- **Work Order stages:** Approved, Work in progress, Completed. Everything can be edited until it's Completed.
- **When work is Completed, it turns into an Invoice.** It shows as Payment pending, Partial payment or Payment completed, depending on the money received.
  - Locked: parts, labour, quantities, prices, customer, vehicle.
  - Still editable: payments, discount, tax, notes, due date.
- **Payment completed:** nothing can be edited.
- **Owner/admin only:** "Reopen" on a Payment completed invoice moves it back to any earlier step: Partial, Payment pending, Completed, Work in progress or Approved. Other roles don't see it.
- **Menu and pages:** "Invoices" splits into **Work Orders** (Estimates, Approved, Work in progress) and **Invoices** (Payment pending, Partial, Payment completed). Both appear in the menu, and each list only shows its own stage. Links and buttons are renamed to match.

## Approach: rename the stages in the database too
The stored stage names change to the new ones, and every existing record moves over in one step:

| Stored today | Stored after | Shown as |
|---|---|---|
| estimate / declined | estimate / declined | Estimate / Declined |
| open | approved | Work order: Approved |
| in-progress | work_in_progress | Work order: Work in progress |
| completed | payment_pending | Invoice: Payment pending |
| partial | partial_payment | Invoice: Partial payment |
| paid | payment_completed | Invoice: Payment completed |

Today's 121 records move like this: 47 open, 11 in progress, 4 completed, 13 partial and 46 paid. Job stages (pending, in progress, completed) are a separate list and stay the same.

**How it's done safely, in one go:** the allowed-stages rule, the "work completed on" automatic date, the invoice delete check, the stored data and all app code switch together. For the few minutes before you publish, the live site could send old names. So for a short time the database accepts both and quietly converts old names to new ones. Once the new version is published, we remove the old names.

## Risks and how we handle them
1. **Revenue and reports shift.** Every revenue, receivables, dashboard and report rule is switched to the new names in the same change. Before and after, we compare this month's and last month's dashboard numbers for Gearhead Garage and AutoFirst, and they must match exactly. "Work completed on" dates are kept.
9. **The live site is briefly out of step with the database.** Handled by the short "accept both, convert old to new" period above. Nothing is refused or lost while you publish.
10. **A missed old name in the code.** An invoice in a missed spot would show blank or fail to save. We search the code for every old name and add a test that fails if one is left.
11. **Undo.** The migration includes a reverse mapping, so the old names can be restored if something goes wrong.
2. **Missed wording.** "Invoice" appears on about 40 screens. We put all names in one shared list and search for every leftover "Open", "Paid" and "Invoice" before finishing.
3. **Editing a closed invoice.** Locked parts and labour also lock in the save itself, not just on screen. Stock and job links can't change after completion.
4. **Reopening causes double stock or revenue.** Reopening only changes the stage. Stock was already taken when the parts were added, so it doesn't move. Reopening to Work in progress or Approved takes it out of revenue until it's completed again (the current rule).
5. **Payments on a work order.** Deposits are still allowed on Approved or Work in progress. They never complete the job (the current rule).
6. **Printed invoices, emails and old links.** The printout title becomes "Work Order" or "Invoice" depending on the stage. Old /invoices links keep working and redirect.
7. **Discount after payment.** Changing the discount on Partial can push payments over or under the total. The status recalculates and the "change / close with discount" dialogs still apply.
8. **Your Google Analytics and Ads tracking** isn't affected.

## Checked against the database, tabs and delete rules
- **Database:** the allowed stages today are open, in-progress, completed, partial, paid, estimate and declined. They're renamed as in the table above. Only the stage name on each record changes, so links from payments, jobs, parts, expenses and bills stay the same. The database's own rules (the "work completed on" date and the invoice delete check) are updated in the same step.
- **Tabs / filters:** the Invoices page has one status dropdown today, with Open, In Progress, Paid, Overdue and the rest. It splits into the two lists with renamed choices. "Overdue" isn't a saved stage. It stays a filter on the Invoices list only (past due date and not fully paid).
- **Deleting a work order or invoice:** same as today. Owner/admin only, refused if payments exist, stock is returned, jobs are released, and its job-cost expenses are removed. Your rule adds one thing: Completed, Partial and Payment completed can't be deleted. You'd reopen it first.
- **Deleting payments:** today a payment can be removed even on a Paid invoice. That conflicts with your rule, so on Payment completed the bin icon is hidden. Removing a payment on Payment pending or Partial stays allowed, and the stage recalculates. Today's fix stays in, so a deleted payment can't come back.
- **Deleting a job (task):** today, deleting a job that's billed on an invoice leaves the invoice line but removes the link. From now on, a job linked to a Completed or later invoice can't be deleted, the same rule as expenses. On Approved or Work in progress it can still be deleted.
- **Assigning jobs:** only to Approved or Work in progress work orders. Today you can also assign to completed invoices, which would change locked lines.
- **Expense delete block** (completed/partial/paid) already matches the new "Completed" lock. No change needed.
- **Revenue, receivables, dashboard:** the same rules, switched to the new names. Before and after figures are compared to prove nothing moved.
- **What could break:** pages or exports that show the raw status text ("open", "paid"), CSV exports and filters saved in links. All are covered by the shared name list and a full search before finishing.

## Technical details
- Migration: drop invoices_status_check. UPDATE the mapping (open→approved, in-progress→work_in_progress, completed→payment_pending, partial→partial_payment, paid→payment_completed). Add a new CHECK that allows the new values plus the old ones during the switch period. Add a BEFORE INSERT/UPDATE trigger that converts old→new. Rewrite set_invoice_completed_at and delete_invoice_cascade/invoice_delete_preview to use the new names, keeping completed_at. A follow-up migration after publish drops the old names from the CHECK.
- Code: `InvoiceStatus` type gets the new values. `src/utils/invoice-status.ts` holds STATUS_LABELS, `stageOf(status)`, and the shared sets WORK_ORDER_STATUSES, INVOICE_STATUSES and REVENUE_STATUSES = payment_pending/partial_payment/payment_completed. Replace every literal in invoice-calculations, dashboard-service, reports, PaymentsSection, InvoiceForm, Expenses delete block, AssignToInvoiceDialog, the invoice service and CSV export.
- Routes: `/work-orders` (estimate, declined, approved, work_in_progress) and `/invoices` (payment_pending, partial_payment, payment_completed). Detail, edit and new reuse InvoiceForm with a stage-aware title. Redirect old detail URLs.
- InvoiceForm: `lockItems` applies to the invoice stages, so the items/customer/vehicle sections are disabled. `lockAll` applies to payment_completed, which makes the form read-only. The status picker shows "Reopen" only to owner/admin on payment_completed.
- The invoice save skips item, stock and task writes for the invoice stages.
- DB guard trigger: block invoice_items insert/update/delete when the parent is in an invoice stage. This also protects against stale screens.
- Estimate conversion: button sets status 'approved'.
- Tests: bun tests for stageOf/labels, the lock rules per status, and reopen allowed only for owner/admin. Then typecheck and build, and you check while signed in.
