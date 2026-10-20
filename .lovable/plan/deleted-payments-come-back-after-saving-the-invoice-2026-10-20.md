# Deleted payments come back after saving the invoice

## What I found (checked in the database)
- Invoice **b2f37d44** (Gearhead Garage, In Progress) has one payment of 8,000, dated 13 Oct. But that payment row was **created on 19 Oct**, six days after its date. So the 13 Oct payment was removed, and the same payment was saved again as a new row. The delete worked. Saving the invoice put the payment back.
- The rules on who can delete payments are fine. Your own shop's staff can delete them.
- **This is not only this invoice.** Three older invoices show the same pattern, a payment re-created days after its date: 02780ac8, 7f3372ad and 29a15c1d (early Sep). Any invoice can hit it.

## Likely cause (to confirm first)
When you press the bin icon, the payment is deleted right away. But when you then press Save, the invoice screen sends its list of payments. If that list still has the old payment, the save treats it as a new payment and adds it back.

## Fix
1. **Confirm the cause.** Remove a payment, then save, on a test invoice. Watch what the save sends.
2. **Saving never brings back a deleted payment.** If the save sends a payment the database no longer has, that payment is skipped, not re-added. Only payments typed in on that screen are added as new.
3. **The screen's list updates the moment a payment is removed,** so both the payments box and Save use the same list.
4. **Clear message.** "Payment removed" is shown once the delete is confirmed. If the delete fails, the payment stays on screen with the reason.
5. **b2f37d44:** you tell me whether the 8,000 payment should stay or be removed, and I'll remove it if needed. The three older invoices are listed for you to check. I won't change them unless you ask.

## Technical details
- `payment-service.syncInvoicePayments`: a payment with an `id` missing from `existing` is skipped instead of inserted (deleted elsewhere). Only rows without an `id` (or a local temp id) are inserted.
- PaymentsSection `handleRemovePayment`: use a functional `setPayments(prev => prev.filter(...))` so the InvoiceForm state can't keep a stale copy. Add a success toast after `removePayment` resolves, and only update local state after it succeeds.
- Check InvoiceForm background refreshes (`fetchInvoiceById` / realtime) don't restore payments from an older snapshot.
- Verify with a bun check of the sync rule (deleted id is not re-inserted, new payment is inserted), typecheck and build. Then you try remove + Save on an invoice while signed in.
