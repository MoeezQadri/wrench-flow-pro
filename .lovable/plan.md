# Fix: duplicated payment, and editing an invoice that won't save

## What I found in your data

The invoice in question (id starting `106986aa`) really does have two identical payments:

- Its lines add up to 23,650, minus a 650 discount, so the invoice is worth **23,000**.
- There are **two payments of 23,000 each** — 46,000 recorded against a 23,000 invoice.
- Both payment records were stamped 88 milliseconds apart, i.e. the Add Payment button was accepted twice from one action.

Cause of the duplicate (confirmed by the code): the Add Payment button stays clickable while the payment is being saved, and the "does this exceed the remaining balance" check reads a stale copy of the payment list. So two near-simultaneous clicks both see "nothing paid yet", both pass the check, and both get saved. The invoice is also still marked Open even though it is fully paid.

Cause of "editing won't save / the tab dies" is **not yet confirmed** — no error was captured in the logs (they only show a fresh login page, consistent with a reload after a crash). Two things in the edit screen are strong suspects, and both are worth removing regardless:

- The invoice form prints a diagnostic line **for every part in inventory (186 of them) on every single re-render**, plus more per item and task. That is a large amount of main-thread and memory work, repeated constantly while typing — the classic cause of a page going unresponsive or the tab being killed.
- After a successful update, the form re-downloads **every invoice in the shop with all their lines and payments** before it navigates away, so a save that already succeeded can appear to hang and then time out after 30 seconds.

So the plan fixes the duplicate for good, removes both stalls, and makes any remaining failure show a real message instead of hanging.

## What will change

1. **Payments can't double up any more**
   - The Add Payment button locks and shows a saving state until the payment is stored, so a second click does nothing.
   - The remaining-balance check is calculated from the current payment list at the moment of saving, so an overpayment is refused even when two clicks arrive together.
   - A payment larger than the remaining balance keeps its current clear refusal message.

2. **Editing an invoice becomes fast and reliable**
   - Remove the per-part / per-item / per-task diagnostic printing from the invoice form (keep a single summary line).
   - After a successful update, refresh just that one invoice instead of re-downloading every invoice, then navigate.
   - If the update genuinely fails, show the underlying reason in the message instead of a generic timeout.

3. **Clean up the affected invoice**
   - Delete one of the two identical 23,000 payments, leaving a single payment of 23,000.
   - With the invoice then fully covered, set its status to Paid so reports and balances read correctly.
   - I'll re-check the whole payments table for any other invoice paid more than its total and report anything else found before touching it.

## What will not change

No change to invoice, tax, discount, receivable, payable, profit or report maths. No layout, permission or workflow changes. Only the duplicate-click guard, the removed logging, the post-save refresh, and the one data correction described above.

## How I'll verify

- Re-check the database: that invoice has exactly one payment of 23,000, status Paid, and no invoice anywhere is paid above its total.
- Open the edit screen for a multi-line invoice, change a line, save, and confirm it saves promptly and returns to the list with the change stored.
- Add a payment with rapid repeated clicks and confirm only one payment is recorded.
- Confirm a payment above the remaining balance is still refused.
- Type check and build must pass clean, with no new console or network errors.

## Technical notes

- `src/components/invoice/PaymentsSection.tsx`: add an in-flight ref lock plus `disabled`/pending state on the add button; derive `totalPaid` inside the save handler from the latest state (functional update) rather than the closed-over `payments` array.
- `src/components/InvoiceForm.tsx`: delete the `parts.forEach(console.log)` block and the per-item/per-task debug logs; after `updateInvoiceWithHook` succeeds, call `fetchInvoiceById(invoiceData.id)` instead of `loadInvoices()`.
- `src/hooks/useOptimizedInvoiceEdit.ts` / `updateInvoiceOptimized`: surface the thrown message unchanged so failures name their cause.
- Data correction runs as SQL: delete the newer duplicate `payments` row for invoice `106986aa-…`, then set that invoice's status to `paid`.
