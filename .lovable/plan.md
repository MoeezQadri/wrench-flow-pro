# Count extra money from overpayments as revenue

## What was found (confirmed in the code)
The overnight check is right. When a customer pays more than the invoice total, the payments box says "the extra counts as revenue" and saves the full amount. But revenue on the dashboard, the chart, the Finance report and exports is worked out only from the invoice's items, discount and tax. Payments are used only for "paid" and "still owed". So on a 100 job paid with 120, revenue shows 100 and the extra 20 is missing.

Note: the same box also says "Change to give back". If the shop actually hands the change back, the extra was never kept and it shouldn't be revenue. The fix below counts it only because you chose to treat it as revenue. The box text will say this clearly.

## What changes
- Every invoice gets an "extra paid" amount: payments minus the invoice total, and never below zero.
- This extra is added to revenue (it isn't taxed, because tax was already charged on the invoice). It follows the same rules as other revenue: it only counts for Completed, Partial or Paid invoices, on the day the work was completed.
- The dashboard totals, the daily chart, the Finance report (revenue, gross and net profit) and its export all include it. The export gets its own "Extra paid" column.
- Money still owed stays the same. An overpaid invoice owes 0 and never lowers what other invoices owe.
- The confirmation box wording: "The extra X will be recorded as revenue (not returned as change)."

## Testing
- Check the numbers on sample invoices: 100 paid with 120 gives revenue 120, owed 0. An exact or partial payment gives the same results as today.
- Check the database for invoices that are already overpaid, and compare the dashboard and report totals with a direct calculation.
- Make sure the app builds and the affected screens open.

## Technical details
- `invoice-calculations.ts`: add `overpaymentIncome = max(0, paidAmount - total)` to the breakdown. Set `revenueExTax = afterDiscount + overpaymentIncome`, so dashboard `revenueOf`, `calculateProfitAndLoss`, and gross and net profit all pick it up automatically. `balanceDue` and `calculateBalanceDue` stay unchanged.
- The dashboard's revenue query must load payments along with the invoice lines (`dashboard-service.ts` selects `payments(amount)`). Check that FinanceReport and FinancialReport already load payments.
- `FinanceReport.tsx` export: add an `overpayment` column.
- `PaymentsSection.tsx`: change the dialog copy.
- No database changes. When done, resolve the project monitoring finding as fixed.
