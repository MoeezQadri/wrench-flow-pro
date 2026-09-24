# Jobs assigned to invoices, and parts appearing twice

## 1. Assigning a saved job to an invoice (confirmed broken)
What I checked:
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

## 2. A part edited in inventory showing twice on the invoice (cause not confirmed yet)
What I checked:
- Saving an edited part updates the existing record. It doesn't create a new part, and it doesn't add a line to any invoice.
- No invoice has the same part on two lines in the database.
- Invoices where the same name shows twice (for example "Indrive/ ride") are two genuinely separate parts. They were bought at different times and prices, because each custom invoice line creates its own inventory part.
- A likely on-screen cause: the app listens for live changes to parts. When an edited part isn't already in the app's list at that moment, the listener adds it to the end. If the list is then reloaded or reopened on the invoice screen, the same part can appear twice in the picker.
- I haven't confirmed that this is the cause.

Changes:
- First, reproduce it: edit a part in inventory, open an invoice's part picker, and see where the duplicate comes from.
- Keep the parts list unique by part ID everywhere it's kept and shown, so one part can never appear twice, whatever the cause.
- Add a picker check: if a part is already on the invoice, adding it again increases the quantity instead of adding a second line.
- If the reproduction shows a different cause, I'll fix that and tell you what it was.

## Payments showing twice
- The database has no duplicate payments in the last 30 days.
- Adding a payment shows two green messages, which can look like a double entry. I'll remove the extra one.

## Test
- Create a job, mark it completed, and assign it to an open invoice from the list. The line appears and the total goes up. Remove the assignment and the line goes away. Paid invoices are blocked with a reason.
- Edit a part in inventory, then open a new invoice and an existing one. The part is listed once, and adding it twice increases the quantity.
- Add a partial payment. It appears once, with one message.

## Technical details
- `src/components/task/AssignToInvoiceDialog.tsx`: invoice combobox. On assign: set `tasks.invoice_id` and insert an `invoice_items` labor row (`task_id`, title, quantity from hours or 1 for lump sum, `price`, `cost 0`) unless one with that `task_id` already exists. On remove: delete that row and clear the link. Block paid, estimate and declined.
- `src/components/InvoiceForm.tsx` (edit mode): list linked tasks that have no item for their `task_id`, with an Add action.
- `src/hooks/useEnhancedRealtime.ts` and `useParts`: dedupe by `id` after every update. On UPDATE for an unknown id, replace rather than blindly append.
- `WorkshopPartsSelector` / `InvoiceForm` part add: when `part_id` already exists on the invoice, increase its quantity.
- `usePayments.addPayment`: drop the duplicate success toast.
