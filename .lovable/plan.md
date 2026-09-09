# Money math audit, payment rules, and data cleanup

## How the numbers work today (verified in code and data)

**Invoice totals** — one shared calculation: items (quantity x price), minus discount, plus tax on the discounted amount. Paid amount is the sum of recorded payments; balance = total - paid. Estimates and declined quotes are excluded from all money totals.

**Receivables** — computed differently in two places:
- Finance page: only Open and Partial invoices, and it recomputes totals itself, ignoring discounts and ignoring payments already received.
- Financial report: every non-paid invoice, but counts the **full** invoice total, not the remaining balance.
So a partly paid invoice is over-reported in both, and the Finance page number can differ from the report for the same data.

**Payables** — also two different sources:
- Finance page reads the payables list (auto-created from each unpaid workshop expense).
- Financial report ignores that list and treats every unpaid expense as a payable, with "overdue" meaning older than 30 days rather than a real due date.

**Profit / loss** — Finance report: net profit = invoiced revenue - all expenses; gross profit = revenue after discount - parts cost. This is invoice-based (accrual), while receivables/payables are cash-based, so they legitimately differ — but nothing in the app says so, which is why the figures look contradictory.

**Marking money as received/paid** — there *are* ways, they are just buried:
- Money in: Payments box inside the invoice edit screen.
- Money out: Finance page > Pending Payables > click a row > record payment. Expenses can also be saved directly as paid.

## Problems found in the data

- 3 invoices are marked **Paid** with no payment records at all (plus 1 more with items and none).
- Recording a payment on a saved invoice writes it immediately, but saving the invoice afterwards **replaces** its whole payment list with whatever the form is holding. If the form opened without payments loaded, saving wipes them — this matches the invoice where payment details disappeared.
- Paying a payable does not push the status back onto the originating expense, so expense-based reports can keep showing it as unpaid.

## What will change

1. **Paid needs proof of payment.** Choosing Paid without payments covering the total is refused on save with: "Add payment details before marking this invoice as paid. Recorded payments must cover the invoice total." Partial requires at least one payment. Status auto-follows payments as it does now.
2. **Never lose payments on save.** Saving an invoice will no longer wipe payments when the form has none loaded; payments are only replaced when the payment list was actually loaded/edited. Payments stay visible (read-only) on paid invoices.
3. **Clean up existing data.** Move Paid invoices with no payment records back to Open (only those with zero payments; nothing else is touched).
4. **One definition per number.**
   - Receivables everywhere = outstanding balance (total minus payments) of billable, unpaid invoices, using the shared invoice calculation.
   - Payables everywhere = the payables list, with real due dates driving "overdue".
   - Paying a payable also marks its expense paid.
5. **Label the reports honestly.** Profit/loss cards get a short note that they are invoice-based, while receivables/payables are cash-based, so the totals are not meant to match. Purchase expenses stay counted once (they are already in expenses; parts cost is shown for margin only).
6. **Make recording money obvious.** A "Record payment" action on the invoice list/detail for open and partial invoices, and an "Add payable" action on the Finance page for bills that did not come from an expense.

## Technical notes

- `src/utils/invoice-calculations.ts`: add a shared outstanding-balance helper; `calculateTotalReceivables` / `calculateOverdueAmount` switch from `total` to `balanceDue`.
- `src/pages/Finance.tsx`: drop the local receivables math, use the shared helpers; add payable creation.
- `src/pages/reports/FinancialReport.tsx`: receivables/payables from the same sources as Finance; overdue by due date.
- `src/components/InvoiceForm.tsx` + `src/components/invoice/InvoiceDetailsFields.tsx`: status validation before submit with the failure message above.
- `src/services/optimized-invoice-service.ts` / `smart-invoice-service.ts`: only call `replaceInvoicePayments` when a payment list was provided and loaded; guard against the empty-array wipe.
- `src/context/data/hooks/usePayables.ts`: on mark-as-paid, also set the linked expense `payment_status` to paid.
- Data fix: one update statement setting the affected Paid invoices (zero payment rows) to `open`; no schema change.
- Verification: typecheck, then re-run the paid-without-payment query to confirm zero rows remain.
