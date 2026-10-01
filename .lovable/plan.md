# Payments should not mark unfinished work as Paid

## What happened (checked in the database)
- **9119af41** (Gearhead Garage): total 26,920. Two payments on 30 Sep (18,000 + 9,220 = 27,220). Once the payments covered the total, the app switched it to **Paid** on its own, which locks editing and counts it as revenue.
- **45dfd630**: total 4,600, one payment of 4,300 on 26 Sep, and it became **Paid** within a second. It is 300 short, so it was not fully covered. It was most likely set to Paid on the screen when that payment was saved. The payment box at the time may have behaved differently.

The cause: the payment box treats "fully paid" as "job finished". A customer who pays in advance makes the invoice Paid before the work is done.

## Fix
1. **Payments no longer finish a job.** On an Open or In Progress invoice, adding a payment (even the full amount or more) keeps the status as it is. The box shows "Paid in full, work not marked complete".
2. **Auto-Paid only after the work is done.** If the invoice is Completed or Partial and payments cover the total, it still becomes Paid (same as now).
3. **Marking the work Completed when it's already paid.** If you mark a fully paid invoice Completed, it moves straight to Paid, so the usual flow still works.
4. **Reopen the two invoices.** Set 9119af41 and 45dfd630 back to **In Progress**. Their payments stay as they are, and they drop out of revenue until you complete them. 45dfd630 will show the 300 still owed.

## Technical details
- PaymentsSection status derivation: only auto-promote to `paid` when the current status is `completed`/`partial`. For `open`/`in-progress`, keep the status. Partial-promotion applies only from `completed`. Overpay dialog and close-with-discount are unchanged otherwise.
- InvoiceForm submit: if the status is set to `completed` and the balance is ≤ 0.005, save it as `paid`.
- Data fix (migration UPDATE by id): set status='in-progress' on both invoices. The existing trigger clears completed_at.
- Test: run a bun check of the status rule for each starting status, check the two rows in the database after the fix, and confirm the build passes. Then you try a deposit on an open invoice while signed in.
