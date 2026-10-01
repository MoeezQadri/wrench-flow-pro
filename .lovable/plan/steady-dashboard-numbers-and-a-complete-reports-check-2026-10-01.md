# Steady dashboard numbers and a complete Reports check

## What I found so far
1. **Dashboard revenue and average job value change on refresh.** This is the likeliest cause, not yet confirmed. The dashboard works out where "the first day" and "the last day" start and end using the shop's time zone (Karachi for Gearhead Garage). That time zone is loaded at sign-in, at the same moment as the dashboard numbers. When the dashboard wins the race, it uses the computer's own time zone instead, so the period's edges move. Invoices finished near the start or end of the period then drop in or out. The numbers are also kept for 5 minutes per period, so whichever version loaded first sticks until the next refresh.
   - Another smaller wobble: "last 30 days" is measured from the exact current time, while the comparison with the previous period uses unrounded times rather than whole days.
   - Real changes also move the numbers. Today's two reopened invoices are one example, and so is any invoice your staff complete.
2. **Payables not showing in Reports.** Confirmed in the code. The "Receivables & Payables" report shows bills only if the Finance, Expenses or Vendors page was opened earlier in the same visit. The report never loads the bills itself, so going straight to Reports shows 0 payables. Expenses on the reports have the same problem.

## Fix
1. **Dashboard waits for the shop's time zone** before working out its numbers. The saved numbers are tied to the time zone too, so a wrong version can't be reused.
2. **Whole days for both periods.** The current period and the comparison period both run from the start of the first day to the end of the last day in the shop's time zone. "Last 30 days" no longer shifts minute by minute.
3. **Every report loads its own data**: invoices, payments, expenses and bills. Nothing depends on another page having been opened first. Each report gets a refresh button and shows "loading" instead of zeros while it loads.
4. **Same rules and time frames everywhere.** Dashboard, chart, Finance page and every report will use one shared set of rules:
   - Revenue and parts cost: Completed, Partial and Paid work only, dated by the "work completed on" day. Overpayments are included.
   - Expenses (overhead): dated by the expense date. Part purchases and costs linked to an invoice are left out.
   - Payments received: dated by the payment date. These go on the cash-flow view, not the revenue view.
   - Receivables: what's still owed right now (not tied to a date range); overdue means past the due date.
   - Payables: unpaid or part-paid bills right now; overdue means past the due date.
   - Each report title will say which date it uses, for example "by completion date" or "by payment date".

## Checks after the change
- For Gearhead Garage, compare dashboard revenue, average job value, chart totals, Finance and the reports for the same period against a direct database calculation. They must match.
- Refresh the dashboard repeatedly (simulating both time-zone-loaded and not-yet-loaded): the numbers stay the same.
- Open Reports directly after sign-in: payables and expenses show without visiting other pages.
- Build passes. I can't sign in to your shop, so a short list of signed-in steps will follow for you to try.

## Technical details
- Confirm the race first: log getOrgTimezone() at fetchDashboardData time, and compare totals under Asia/Karachi and under browser UTC.
- Dashboard: gate loading on AuthContext organization loaded; include getOrgTimezone() in cacheKey; previous period via toOrgDayBoundary on subDays(start, n) / subDays(start, 1).
- Reports (FinancialReport, FinanceReport, InvoicingReport, Reports overview): on mount call loadInvoices, loadExpenses, loadPayables, loadPayments via smartLoad; show a loading state.
- Audit every money aggregation (rg calculateInvoiceBreakdown / isRecognizedRevenue / isInventoryOrJobCostExpense / payables) so that all of them use the shared helpers in invoice-calculations.ts. Fix any that differ.
