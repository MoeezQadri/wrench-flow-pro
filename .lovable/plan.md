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

**Why you cannot find the Finance page** — the page exists at `/finance` but there is no link to it anywhere in the side menu, so it is effectively hidden. Same for the payables list that lives on it.

**Marking money as received/paid** — there *are* ways, they are just buried:
- Money in: Payments box inside the invoice edit screen.
- Money out: Finance page (unreachable today) > Pending Payables > click a row > record payment. Expenses can also be saved directly as paid.

**Bills for expenses and parts** — every workshop expense that is not already paid automatically becomes a pending bill. A part bought with a vendor selected also creates an unpaid expense (cost x quantity), so it becomes a bill too — but only when a vendor is chosen, and it is always stamped "cash" as the method even though nothing has been paid yet.

## Problems found in the data

- 3 invoices are marked **Paid** with no payment records at all (plus 1 more with items and none).
- Recording a payment on a saved invoice writes it immediately, but saving the invoice afterwards **replaces** its whole payment list with whatever the form is holding. If the form opened without payments loaded, saving wipes them — this matches the invoice where payment details disappeared.
- Paying a bill does not push the paid status back onto the originating expense, so expense-based reports can keep showing it as unpaid.


## What will change

1. **Make Finance reachable, with the same rules as the rest of the app.** Add "Finance" to the side menu and gate it exactly like other pages: an active subscription or trial is required, and only owners, admins and a finance role can see or open it. Everyone else does not see the menu item, and typing the address directly shows the standard "no access" screen. Today there is no finance role, so a "Finance" role is added to the invite list and given access to Finance, Expenses, Invoices and Reports (view plus record payments), not to technicians, tasks or attendance.
2. **Bills to pay, end to end.**
   - Every unpaid expense and every part purchase (with or without a vendor) shows up as a bill, described with the vendor and what it was for.
   - Part purchases stop being stamped "cash" while unpaid — no payment method until it is actually paid.
   - Clicking a bill records the payment: amount (full or part), payment method, payment date, notes. Part payments leave the remainder outstanding instead of closing the bill.
   - Paying a bill marks the linked expense paid with the same method and date, so Expenses, the bills list and the reports all agree.
   - An "Add bill" action on the Finance page for vendor bills that did not start as an expense.
3. **Paid needs proof of payment.** Choosing Paid without payments covering the total is refused on save with: "Add payment details before marking this invoice as paid. Recorded payments must cover the invoice total." Partial requires at least one payment. Status auto-follows payments as it does now.
4. **Never lose payments on save.** Saving an invoice will no longer wipe payments when the form has none loaded; payments are only replaced when the payment list was actually loaded/edited. Payments stay visible (read-only) on paid invoices.
5. **Clean up existing data.** Move Paid invoices with no payment records back to Open (only those with zero payments; nothing else is touched).
6. **One definition per number.**
   - Receivables everywhere = outstanding balance (total minus payments) of billable, unpaid invoices.
   - Payables everywhere = the bills list, with real due dates driving "overdue".
7. **Reports agree with each other.** Expense reports show paid vs unpaid consistently, the bills total matches the Finance page, and profit/loss keeps counting each expense once. Profit/loss cards get a short note that they are invoice-based while money in/out is cash-based, so the totals are not meant to match.
8. **Make recording money in obvious.** A "Record payment" action on the invoice list and detail for open and partial invoices.

## Technical notes

- `src/utils/permissions.ts`: add a `finance` resource (`view`/`create`/`edit`) for `owner`, `admin`, `finance`, add `finance` to `ROLE_PERMISSIONS`, and include it on `expenses`, `invoices`, `payments` and `reports` view rules.
- `src/components/AppSidebar.tsx`: Finance nav item using resource `finance`, action `view` (already filtered by `hasPermission` and `subscribed`).
- `src/App.tsx`: `/finance` stays inside `SubscriptionRoute` and gets wrapped in `PagePermissionGuard` for resource `finance`; role labels/invite options updated wherever roles are listed (`getRoleLabel`, user invite and management UI).

- `src/utils/invoice-calculations.ts`: shared outstanding-balance helper; `calculateTotalReceivables` / `calculateOverdueAmount` switch from `total` to `balanceDue`.
- `src/pages/Finance.tsx`: use the shared helpers for receivables; bill list with partial-payment support, add-bill dialog, paid history.
- `src/components/payable/PayableDialog.tsx`: support partial payments (`paid_amount` accumulation, status `pending` vs `paid`) and keep method/date/notes.
- `src/context/data/hooks/usePayables.ts`: on payment, accumulate `paid_amount`, set status accordingly, and update the linked expense (`payment_status`, `payment_method`) — the DB trigger already handles expense to payable in the other direction.
- `src/components/part/PartDialog.tsx`: create the purchase expense without a payment method while unpaid, and create it even when no vendor is selected.
- `src/pages/reports/FinancialReport.tsx`: payables from the bills list, overdue by due date; receivables by balance.
- `src/components/InvoiceForm.tsx` + `src/components/invoice/InvoiceDetailsFields.tsx`: status validation before submit with the failure message above.
- `src/services/optimized-invoice-service.ts` / `smart-invoice-service.ts`: only call `replaceInvoicePayments` when a payment list was actually loaded; guard against the empty-array wipe.
- Migration only if needed for a nullable `payment_method` on expenses; otherwise no schema change. Data fix: set Paid invoices with zero payment rows back to `open`.
- Verification: typecheck, re-run the paid-without-payment query, and re-check bill/expense status agreement in the database.

## End-to-end test pass after the changes

Walk the whole money flow in the running app and report results:

1. Create an invoice with a workshop part, a labour item and a custom item; confirm totals, tax and discount.
2. Try to set it to Paid with no payments — confirm the refusal message; then record a part payment (status becomes Partial) and the rest (status becomes Paid).
3. Reopen and save the paid invoice — confirm the payment history is still intact.
4. Create an estimate, convert it to an invoice, and confirm it never counted as revenue while it was a quote.
5. Add an expense and a part purchase — confirm both appear as bills, pay one in part and one in full with a method, and confirm the expense shows as paid.
6. Check Finance, Expenses, Invoices, the finance/financial reports and the dashboard against each other: receivables equal outstanding balances, bills equal unpaid expenses, profit figures count each expense once.
7. Access check: Finance visible for owner, admin and finance role; hidden and blocked for technician; blocked when the subscription or trial has ended.

Signed-in browser testing may be limited because this project uses its own Supabase auth; if a step cannot be driven in the browser it will be verified with direct database checks and reported as such.


