# Let work orders take an advance before any work is added

## What's going wrong

The last change only removed one check, a form check. Three more spots still block an advance on a work order that has no parts or labour yet:

1. **The payment disappears from the list.** The payment box quietly drops any payment that is more than the work order's total. With no lines, the total is 0, so every advance gets dropped. On a new work order it never shows up. On a saved work order it is saved but doesn't show on screen, so it looks like it failed. A later Update could even delete it, because the screen doesn't know it exists.
2. **The screen refuses to create it.** When you press "Create Work Order", the screen stops with "No valid items" or "zero total amount".
3. **The save step refuses it too.** The step that writes a new work order still demands at least one line and a total above zero.

Saved work orders that are edited and emptied are not affected. That save path already accepts no lines.

## Fix

- **Payment box:** on work-order stages (Approved, Work in progress, Work completed), always add the advance to the list, whatever the total. Invoices keep the current rule: paying more than is due opens the "More than the amount due" box first.
- **Create Work Order:** skip the "no items" and "zero total" checks when the document is a work order. Estimates and invoices still need lines.
- **Saving a new work order:** allow no lines when the stage is a work order. Skip saving lines, stock changes and linking jobs when there are none. Still save the payments.
- After creating a work order, open the **Work Orders** list instead of Invoices.

Nothing changes for revenue: an advance isn't revenue until the work order is moved to an invoice. "Move to invoice" keeps its current rules.

## How I'll check it

- New work order, no lines, advance of 5,000 cash. It shows in the list, the work order saves, and the advance is still there after reopening.
- Saved empty work order, add an advance. It shows right away and survives Update.
- An invoice without lines still can't take a payment, and paying more than is due on an invoice still asks first.
- Add a small test for the rule "work orders may be saved with no lines; estimates and invoices may not".

## Technical details

- `src/components/invoice/PaymentsSection.tsx`: in `savePayment`, the `already + amount > total` guard inside both `setPayments` updaters applies only when `!isWorkOrderStage`. Add `status` to the `handleAddPayment` deps.
- `src/components/InvoiceForm.tsx` (create branch, around lines 657-669): run the `mergedItems.length === 0` and `totalAmount === 0` throws only when `!isWorkOrder(effectiveStatus)`. Navigate to `/work-orders` when the created status is a work order.
- `src/services/optimized-invoice-service.ts` `createInvoiceOptimized`: run the items and zero-total checks only for non-work-order statuses. When `items` is empty, skip `ensureInventoryParts`, the `invoice_items` insert, `applyInventoryChanges` and task linking. Keep the payment insert and the rollback.
- Put the rule in a small helper in `src/utils/invoice-status.ts` (for example `canSaveWithoutItems(status)`), and add a test in `tests/unit/invoice-status.bun.test.ts`.
