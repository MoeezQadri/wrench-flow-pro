# Jobs assigned to invoices, and payments appearing twice

## 1. Assigning a saved job to an invoice (confirmed broken)
What the checks found:
- On the Jobs page, "Assign to invoice" asks you to type the invoice's full internal ID, which is 36 characters long. The app never shows that ID, so in practice the job almost never gets assigned.
- When it does assign, it only links the job to the invoice. It never adds a labor line, so the invoice total doesn't change and the job isn't billed.
- 19 jobs are linked to an invoice but have no line on it, some on invoices already marked Paid.
- Completed invoices are refused, even though "Completed" now means "work done, money still due".
- New invoices only pick up jobs recorded against the same vehicle. 43 of 63 jobs have no vehicle, so they never show up on their own.

Changes:
- Replace the ID box with a searchable list of invoices you can still add work to (Open, In progress, Partial, Completed). Each one shows its number, customer, vehicle and total.
- Assigning a job links it and adds the matching labor line (job title, hours, price) in one step, and the invoice total updates. Removing the assignment takes the line off again.
- Paid, Estimate and Declined invoices can't be picked. The list says why.
- A job that's already billed on an invoice can't be added to a second one.
- On the invoice edit screen, jobs linked to that invoice but missing a line appear as "Linked jobs not yet billed", with an Add button.
- The 19 existing linked-but-unbilled jobs stay as they are, because most are on paid invoices and adding lines would change totals that were already paid. I'll list them for you so you can decide.

## 2. Payments or payables appearing twice (not found yet)
What the checks found:
- In the database, no invoice has duplicate payments in the last 30 days.
- No bill has more paid against it than it's worth.
- The only duplicate expense set is an old test invoice from 11 August.
- The save code checks for existing payments by their ID, so it can't insert the same payment twice.
- Adding a payment shows two green confirmation messages. That can look like it was added twice.

Next step: I need one invoice where you saw it happen: the invoice number, plus whether it was a customer payment or a vendor bill payment. I'll trace that one exactly. For now I'll only remove the extra confirmation message.

## Test
- Create a job, mark it completed, and assign it to an open invoice by picking from the list. The line appears and the total goes up.
- Remove the assignment. The line goes away.
- Try assigning to a paid invoice. It's blocked with a reason.
- Add a partial payment and then the rest. Each payment appears once, and you see one message.

## Technical details
- `src/components/task/AssignToInvoiceDialog.tsx`: query the eligible invoices with customer and vehicle, and use a combobox. On assign: update `tasks.invoice_id`, and insert an `invoice_items` row (`type 'labor'`, `task_id`, `description = title`, quantity from hours or 1 for lump sum, `price`, `cost 0`), unless one with that `task_id` already exists. On remove: delete the `invoice_items` row with that `task_id` and clear the link. Block this if the invoice is paid, estimate or declined.
- `src/components/InvoiceForm.tsx`: in edit mode, show tasks where `invoiceId === invoice.id` that have no item with that `task_id`, with an Add action. Don't change any formulas.
- `usePayments.addPayment`: drop the success toast, because PaymentsSection already reports the result.
