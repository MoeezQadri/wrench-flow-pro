# Stop "Update work order" from turning it into an invoice

## What I found
- In the last few minutes, three Gearhead Garage work orders became **Payment completed** right after being saved (a4f694c8, 20ab441b, and 9ea25c4b earlier today). Each one already had payments that covered almost all of the total.
- The live site already has the latest version, with the "Move to invoice" button, so this isn't a publish problem.
- The weak spot is in the work order screen. The stage it saves is just whatever is in the screen's memory at that moment, and two things can change that without you noticing:
  1. **Move to invoice leaves its choice behind.** Tapping Move to invoice sets the stage to "Payment pending" first, then saves. If that save stops halfway (a missing field, a clash warning, a network hiccup), the screen keeps "Payment pending". The next normal **Update** then turns the job into an invoice.
  2. **The payments box can also set the stage** (for example "Close with discount", or after a payment). The screen then saves that stage on the next Update.
- I can't sign in to your shop from here, so I can't yet say which of the two caused these three. The fix below covers both.

## The fix
1. **Update only ever saves a work order stage.** When the job is still a work order and you press Update, the stage saved is Approved, Work in progress or Work completed, never an invoice stage. Anything else in memory is ignored.
2. **Only the Move to invoice button can make an invoice.** It passes its choice straight to the save. It no longer changes the stage on screen first. If that save fails, nothing is left behind, and the screen still shows the work order stage.
3. **The payments box never changes the stage of a work order.** "Close with discount" and the automatic payment-stage changes only work on invoices (Payment pending / Partial payment).
4. **Database safety net.** Saving a job straight from a work order stage to an invoice stage is only allowed when the save says it's an intentional "move to invoice". Every other save keeps the work order stage. That way an older open browser tab can't do it either.
5. **The three affected jobs.** I'll list them for you so you can tell me which ones should go back to work orders. Owner/admin can also reopen them with the Reopen option.

## How I'll check it
- Tests: Update on a work order with full payment stays a work order. A failed Move to invoice, followed by Update, stays a work order. Move to invoice still works.
- Typecheck and build. You then try it while signed in: add a full payment to a work order, press Update (it stays under Work Orders), then press Move to invoice.

## Technical details
- InvoiceForm: drop the `moveToInvoiceRef` + `setStatus('payment_pending')` + `requestSubmit` approach. Instead, `onSubmit(moveToInvoice: boolean)`. When savedStatus is a work order and the save isn't a move, clamp `status` to WORK_ORDER_STATUSES (fall back to savedStatus). When it is a move, use the effectiveStatus calculation.
- PaymentsSection: guard `handleCloseWithDiscount` and the auto-promotion with `isInvoiceStage(status)`.
- Migration: a BEFORE UPDATE trigger on invoices. If OLD.status is in (approved, work_in_progress, work_completed) and NEW.status is an invoice stage, it reverts to OLD.status unless a session flag `app.move_to_invoice = 'on'` is set. The move goes through a small security-definer RPC `move_work_order_to_invoice(id, status)` that sets the flag. The legacy-name trigger ordering is kept.
- Remove the unused InvoiceDetailsFields status list, which still offers invoice stages.
