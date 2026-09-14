# Invoice completion, payments, expense list and faster search

## 1. Why payments cannot be added, on completed and on ordinary invoices

Three separate blocks were found in the code:
- The invoice list hides Edit for **Paid** and **Completed**, and the edit screen itself refuses to open anything that is not Open, In progress, Partial, Draft or Estimate. So a Completed invoice can never be opened — and Add Payment only exists inside the edit screen. There are 7 completed invoices right now.
- On an invoice you *can* open, the payment box disappears the moment the status dropdown is set to **Paid**. Anyone who marks the invoice Paid first then has nowhere to enter the payment, and saving is refused with "Add payment details before marking this invoice as paid" — a dead end.
- A payment is refused when it would exceed the amount still due. If the invoice total is still zero (no lines added yet) every amount is refused, and the message doesn't explain why.

Changes:
- **Completed** means the work is finished but money is still due: Completed invoices open for editing and can take payments.
- The payment box stays visible for every status except Estimate and Declined, so you can record the payment whether you set the status first or after.
- When payments cover the full amount the invoice becomes **Paid** automatically; a partial payment makes it **Partial**.
- **Paid** invoices stay view-only. The Edit button is replaced with a short note: remove a payment first to change it.

## 2. Add Payment messages

- Keep the safety rules (amount above zero, cannot exceed the amount still due, no double-click double-entry) but say exactly what is wrong and how much is still due, including "add invoice lines first" when the total is zero.
- All payment methods (cash, card, bank transfer, cheque, other) are saved the same way; no method blocks saving.
- After adding, the paid/remaining figures and the invoice status update straight away.


## 3. Expense added but not appearing in the list

Two problems found in the expense screen:
- When adding a new expense the date, amount and description start empty, so pressing Add can be refused by the form without an obvious reason.
- After saving, the list is updated with the on-screen copy of the expense rather than the saved record, and the list is sorted only by date — an expense entered today but dated earlier drops far down the list, so it looks missing.

Changes:
- New expenses open with today's date pre-filled and any refused field clearly flagged.
- After saving, the list reloads the saved record, and sorting falls back to entry time so a just-added expense is always visible near the top.

## 4. Search feels frozen (customers, invoices, parts, vehicles)

The customer screen searches over name, email, phone and address. Nine customers have no email and one has no address, and the code assumes every customer has all four — that alone can blank the screen. On top of that the whole list, including each customer's totals and cars, is recalculated on every keystroke.

Changes:
- Treat missing email/phone/address as empty instead of crashing.
- Recalculate the filtered list only when the text or data actually changes, and wait a moment after typing stops before filtering.
- Render customer rows so unchanged rows are not rebuilt on each keystroke.
- Apply the same debounce-and-remember treatment to the search boxes on Invoices, Parts and Vehicles.

Nothing about how figures are calculated (profit, payables, COGS, tax) changes.

## Technical notes

- `src/pages/Invoices.tsx`: drop `completed` from the Edit-hiding condition; keep `paid` and `declined` locked, show a reason instead of the button.
- `src/pages/EditInvoice.tsx`: add `completed` to the `canEdit` status list (this redirect is the hard block today).
- `src/components/invoice/PaymentsSection.tsx`: `canEditPayments` excludes only `estimate`/`declined` (drop the `paid`/`cancelled` exclusion so the box stays visible); keep the concurrency and remaining-balance guards, improve messages; status transitions stay `partial`/`paid` via `setValue`.
- `src/components/invoice/InvoiceDetailsFields.tsx`: keep `completed` in the editable-discount statuses.
- `src/components/expense/ExpenseDialog.tsx`: default `date: new Date()`, `amount: undefined` with clear validation, description empty; return the persisted row from `handleSaveExpense`.
- `src/pages/Expenses.tsx`: after save call `loadExpenses()` rather than splicing the form object; sort by `date` then `created_at` desc.
- `src/pages/Customers.tsx`: null-safe filter (`(customer.email ?? '')`), wrap `filteredCustomers` in `useMemo`, debounce `searchQuery` with the existing `useDebounce` hook, memoise the card component.
- Same debounce + `useMemo` pattern in `src/pages/Invoices.tsx`, `src/pages/Parts.tsx`, `src/pages/Vehicles.tsx`.
- No database or schema changes.

## Testing after the changes

- Open a completed invoice, add a cash payment and a bank-transfer payment, confirm totals, status change to Partial then Paid.
- Confirm a paid invoice cannot be edited and shows the reason.
- Add a workshop expense with today's date and with a back-date; both appear immediately in the list with the right bill status.
- Type letters quickly in customer search with customers that have no email; no blank screen, results filter smoothly. Repeat on Invoices, Parts, Vehicles.
- Compile, build, and check the browser console for errors.
