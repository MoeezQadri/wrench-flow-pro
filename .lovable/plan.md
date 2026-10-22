# Advance payments on empty work orders, and moving to Invoice only when you choose

## 1. Advance payments before any parts or labour
**Today:** a work order can't be saved without at least one line, and the payment box refuses any payment when the total is 0 ("Add invoice lines first").

**Change:**
- A work order (Approved / Work in progress) can be saved with no lines yet. Estimates and invoices still need at least one line.
- On a work order, the payment box accepts any amount as an **advance**, even with no lines or more than the current total. No "extra paid / change" dialog at this point, because the work isn't priced yet. The box shows "Advance received: X".
- The advance never changes the stage (current rule kept).
- When the work order later moves to Invoice, the normal rules apply: payment stage follows the money (Payment pending / Partial / Completed), and if the advance is more than the final total, the existing "extra paid" dialog asks how to handle it.
- An advance is not revenue until the work order becomes an invoice (current rule kept).

## 2. Saving a work order never turns it into an invoice by itself
**Cause:** the Status list on a work order has a "Completed" choice that is really the first invoice stage. Picking it (or saving with it selected) moves the job to Invoices straight away and locks its lines.

**Change:**
- Work order stages become **Approved, Work in progress, Work completed**. "Work completed" stays a work order: still in the Work Orders list, still fully editable, not locked.
- A separate button, **Move to invoice**, appears on work orders (any work-order stage). It asks for confirmation ("Parts, labour, customer and vehicle will be locked"), then moves it to Payment pending / Partial / Payment completed based on payments received.
- The Status dropdown no longer offers any invoice stage on a work order, so a normal Save can never create an invoice.
- Owner/admin Reopen also offers "Work completed".

**Revenue timing:** revenue and parts cost will count from the moment it's moved to invoice (the "work completed on" date is set then, and is still editable). Work completed but not yet invoiced is not revenue. Say if you'd rather count it at "Work completed".

## Technical details
- Migration: add `work_completed` to invoices_status_check (keep current values). No data changes; existing rows unaffected. completed_at trigger unchanged (still set on entering invoice stages).
- invoice-status.ts: WORK_ORDER_STATUSES += 'work_completed'; label "Work completed"; InvoiceStatus type updated. Update tests (stageOf('work_completed') = work_order, canEditItems true).
- InvoiceForm: work-order statusOptions = approved / work_in_progress / work_completed; reopen list adds work_completed. Add "Move to invoice" button + AlertDialog that sets status to payment_pending and submits through the existing completingNow/effectiveStatus path. Skip the "at least one item" validation for work-order stages; zero-total check only when items exist.
- PaymentsSection: drop the `total <= 0` block and the overpay dialog when the status is a work-order stage; show "Advance received". Invoice stages unchanged.
- Check other spots listing work-order statuses (Invoices list filter, AssignToInvoiceDialogs, PartForm, OrganizationSettingsTab tax update, StatusBadge) include work_completed.
- Verify: bun tests, typecheck, build; then you try signed in: new empty work order, add advance, set Work completed, save (stays a work order), then Move to invoice.
