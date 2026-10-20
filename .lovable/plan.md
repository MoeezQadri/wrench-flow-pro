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

## Approach: rename, don't rebuild
The app already has these stages under other names. So we change what people see, not how invoices are saved:

| Today | New name |
|---|---|
| Estimate / Declined | Estimate / Declined |
| Open | Work order: Approved |
| In progress | Work order: Work in progress |
| Completed (money still due) | Invoice: Payment pending |
| Partial | Invoice: Partial payment |
| Paid | Invoice: Payment completed |

All 121 existing invoices map over directly. Nothing in the saved data changes.

## Risks and how we handle them
1. **Revenue and reports shift.** We keep the saved values as they are. Revenue still counts from Completed, dated by "work completed on". Dashboard and report figures stay identical.
2. **Missed wording.** "Invoice" appears on about 40 screens. We put all names in one shared list and search for every leftover "Open", "Paid" and "Invoice" before finishing.
3. **Editing a closed invoice.** Locked parts and labour also lock in the save itself, not just on screen. Stock and job links can't change after completion.
4. **Reopening causes double stock or revenue.** Reopening only changes the stage. Stock was already taken when the parts were added, so it doesn't move. Reopening to Work in progress or Approved takes it out of revenue until it's completed again (the current rule).
5. **Payments on a work order.** Deposits are still allowed on Approved or Work in progress. They never complete the job (the current rule).
6. **Printed invoices, emails and old links.** The printout title becomes "Work Order" or "Invoice" depending on the stage. Old /invoices links keep working and redirect.
7. **Discount after payment.** Changing the discount on Partial can push payments over or under the total. The status recalculates and the "change / close with discount" dialogs still apply.
8. **Your Google Analytics and Ads tracking** isn't affected.

## Technical details
- Keep the DB `status` values. Add `src/utils/invoice-status.ts` STATUS_LABELS + `stageOf(status)` ('estimate' | 'work_order' | 'invoice'); replace all hard-coded labels and badges.
- Routes: `/work-orders` (status IN estimate, declined, open, in-progress) and `/invoices` (completed, partial, paid). Detail, edit and new reuse InvoiceForm with a stage-aware title. Redirect old detail URLs.
- InvoiceForm: `lockItems = ['completed','partial','paid'].includes(status)` disables the items/customer/vehicle sections. `lockAll = status === 'paid'` makes the form read-only. The status picker for paid shows "Reopen" only when role is owner/admin; otherwise no picker.
- optimized-invoice-service `updateInvoiceOptimized`: when the saved status is completed/partial/paid, skip item, stock and task writes and reject item changes. Allow paid edits only from owner/admin reopen.
- Optional DB guard (migration trigger): block invoice_items insert/update/delete when the parent invoice status is completed/partial/paid. This also protects against stale screens.
- Estimate conversion: button sets status 'open'.
- Tests: bun tests for stageOf/labels, the lock rules per status, and reopen allowed only for owner/admin. Then typecheck and build, and you check while signed in.
