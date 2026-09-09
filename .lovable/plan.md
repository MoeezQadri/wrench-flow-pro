# Payable Management — bills and payments in one place

The Finance section becomes **Payable Management**: money the shop owes (payables/bills), not money coming in. Today an expense form asks for a payment method even though nothing has been paid yet, the payment popup prints `$` regardless of the shop's currency, and parts bought on credit have no clear place to be paid off. This fixes all of that and adds a proper vendor payment view.

- Rename the page title/nav from "Finance" to **Payable Management**.
- Remove the **Money In (Receivables)** card and the overdue-receivables figure from this page — receivables stay on invoices/reports.
- Remove the **Add bill** button and its dialog from this page; bills are created automatically when expenses or part purchases are recorded.

## 1. Expenses are bills only

- Remove the Payment Method field from the Add/Edit Expense form. An expense is always created as an unpaid bill.
- Replace the "Payment Method" column in Expense History with a **Payment status** column: Unpaid, Partly paid (with amount paid), or Paid (with method and date).
- "Mark as paid" on an expense keeps working, but it opens the same record-payment popup used in Payable Management and supports partial amounts (today it forces the expense to fully Paid even when less was paid).
- Existing expenses keep whatever method was already stored; nothing is deleted.

## 2. Currency instead of `$`

- The record-payment popup shows total, already paid, outstanding and amount-paid values in the organization's currency, including the validation message about the outstanding amount.
- The amount field is labelled with the shop's currency symbol, matching the expense form.

## 3. Parts bought on credit

- When a part is added with a cost, it already creates an unpaid bill. That bill will be clearly named (part name, quantity, vendor) and dated on the purchase date, so it shows up under Payable Management > Bills > Unpaid and against the vendor.
- Paying it off — fully or partially — happens from Payable Management > Bills, or from the vendor's bill list. Partial payments leave the bill Unpaid with the amount paid recorded and the remaining balance shown.
- The Parts page gets a small "Unpaid" / "Paid" indicator per part purchase so it's obvious what is still owed, linking to the bill.

## 4. Vendors: what you're paying against

- Each vendor row gets an **Amount owed** figure and an expandable list of that vendor's bills (description, date, due date, bill total, paid, outstanding, status).
- Payment is always recorded against a specific bill, so a partial payment is never ambiguous.
- A **Pay vendor** button allows one lump payment across several bills: it pre-fills allocation oldest bill first, and the amounts per bill stay editable before saving. Each bill gets its own payment record, method and date.

## 5. Consistency

- Expenses, Payable Management, the profit/loss and financial reports all read the same outstanding-balance figures, so a partial payment shows the same way everywhere. (Receivables are not shown on this page.)

## Technical notes

- `src/components/expense/ExpenseForm.tsx`: drop `paymentMethod` from the zod schema and UI; `ExpenseDialog.tsx` stops sending `payment_method` on create.
- `src/pages/Expenses.tsx`: payment-status column derived from the linked payable (`paid_amount` vs `amount`), not `expense.payment_method`.
- `src/components/expense/MarkAsPaidButton.tsx`: set expense `payment_status` to `partial` or `paid` based on the payable result instead of always `paid`; rely on `usePayables.markAsPaid` for the sync.
- `src/components/payable/PayableDialog.tsx`: use `useOrganizationSettings().formatCurrency` / `getCurrencySymbol` for every money string.
- `src/components/part/PartDialog.tsx`: bill description includes quantity and vendor; purchase date used for the expense date.
- New `src/components/vendor/VendorBillsSection.tsx` and `src/components/vendor/PayVendorDialog.tsx`, using `getPayablesByVendor` from `usePayables` and calling `markPayableAsPaid` per allocated bill.
- Trigger `handle_expense_payment_update` currently forces a linked payable to fully paid when the expense flips to paid — payment recording keeps writing the payable first and only marks the expense `paid` when the balance is zero, so partials aren't overwritten. No schema change needed; partial history stays as `paid_amount` plus last payment details.
- Verification: typecheck, then a walk-through of expense → bill → partial payment → full payment, part purchase → vendor bill, and a vendor lump payment across two bills.
