# Fix profit, cost of parts, and report totals

## What is wrong today

- **Net Profit counts tax as income.** Revenue is taken as the full billed amount, tax included, so profit looks bigger than it is.
- **Parts are counted twice over, in the wrong period.** Buying parts already reduces profit as an expense, and the report also shows a separate "Parts COGS" figure. Parts you bought but have not sold yet still pull profit down.
- **Cost of parts sold is understated.** 88 of the 156 part lines on invoices have no cost saved, so the report silently treats them as free. Copying costs in would be wrong: 135 of 164 stored parts have cost equal to selling price, which is clearly an old default, not a real cost.
- **Invoicing report overstates what customers owe.** Money received is only counted on invoices already marked Paid, so every part payment on an open invoice is ignored, and payments outside the chosen dates are mixed in.
- **Dashboard revenue and report revenue disagree**, because the dashboard also includes tax.
- **Financial report's Net Position compares apples with oranges**: customer debt is picked by invoice date, while bills are picked by due date.

## What changes

**Profit report (Financial Report page)**

New, clearly labelled sequence:

```text
Revenue (before tax)
- Cost of parts sold
= Gross Profit
- Running costs (rent, wages, and other bills)
= Net Profit
```

- Revenue excludes tax everywhere in profit figures; tax collected is shown as its own line so nothing disappears.
- Parts purchases and part costs charged onto invoices no longer count as running costs, so a part is only counted once and only when it is sold.
- A visible note shows how many part lines are missing a cost, with the wording "Cost of parts sold is incomplete: N part lines have no cost recorded." No cost is guessed or invented.
- Percentages are recalculated from the corrected figures.

**Invoicing report**

- Money received counts every payment on billable invoices, including partial ones, and only payments inside the chosen dates.
- Outstanding is the real unpaid balance of those invoices, so it can never go negative or ignore part payments.

**Financial report — receivables and payables**

- Customer debt and bills are both selected on the same basis for the chosen period, so Net Position is comparable.
- Overdue figures continue to use each item's real due date.

**Dashboard**

- Revenue and average job value exclude tax, matching the reports.

**Everywhere**

- Non-billable quotes and declined invoices stay excluded from every money figure (already the case; will be re-confirmed).

## Technical notes

- `src/utils/invoice-calculations.ts`: add a shared `revenueExTax` (the after-discount amount) plus counters for part lines missing a cost snapshot; keep `total` for what the customer owes. Gross profit stays `revenueExTax - partsCost`.
- `src/pages/reports/FinanceReport.tsx`: build the P&L from `revenueExTax`, `partsCost` and operating expenses = filtered expenses excluding `category = 'parts'` and any expense carrying an `invoice_id`; add the missing-cost notice and fix margin maths.
- `src/pages/reports/FinancialReport.tsx`: reuse the same revenue/COGS helpers; align the payable period filter with the receivable one; drop the unused `filteredExpenses`.
- `src/pages/reports/InvoicingReport.tsx`: replace the status-gated `paidAmount` with per-invoice `calculateInvoiceBreakdown().paidAmount` over billable invoices, date-filtered; outstanding via `calculateBalanceDue`.
- `src/services/dashboard-service.ts`: revenue and average job value from `revenueExTax` for both current and previous period.
- No database migration and no data rewrite; the missing part costs are surfaced, not filled.

## Verification

- Recompute revenue, cost of parts sold, gross and net profit from the database with SQL and confirm the report shows the same numbers for the same period.
- Check an invoice with a partial payment shows the right outstanding amount in the Invoicing report.
- Confirm dashboard revenue equals the report's revenue for the same dates.
- Confirm typecheck and build stay clean.
