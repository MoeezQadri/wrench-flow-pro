# Invoice save speed, money definitions, and the false "someone else edited" warning

## 3) The "someone else edited this invoice" warning (answer first, it's a real bug)

**Other shops can't see your invoices.** Every read, update and delete on invoices is limited to the signed-in person's own shop (or Super Admin). Invoice IDs are random and unique, so no other shop can have the same one.

**What caused the warning on Gearhead Garage:** it was the app itself, not a person. When a payment is added (or removed, or "Close with discount" is used) on an open invoice, the payments box saves the invoice status right away and stamps a new "last changed" time. The invoice screen still remembers the old time, so:
- the live watcher sees the new time and shows "changed elsewhere", and
- pressing Save is refused as a clash, because the saved time no longer matches.

**Fix:** when the payments box saves, it hands the new "last changed" time back to the invoice screen, so the screen treats it as its own change. Real edits by another person on another screen will still be caught and warned about.

## 1) Why saving an invoice is slow

Saving an existing invoice runs many steps one after another, each a separate trip to the server:
1. Read the old invoice, then save the invoice.
2. Read old lines, then save lines.
3. For every part: read stock, then update stock (one part at a time).
4. For every new custom part: look it up, create it, create its expense (one at a time).
5. Link jobs, sync labour jobs.
6. Compare and save payments (one at a time).
7. Afterwards the screen re-downloads the invoice before leaving.

With 10 parts this is easily 30-50 server trips in a row.

**Improvements (same results, fewer waits):**
- Read all affected parts' stock in one request, then update them together instead of one by one.
- Save payment changes together instead of one by one.
- Run job linking and labour-job sync side by side, not one after the other.
- Skip stock and payment steps entirely when nothing in them changed.
- Leave the screen as soon as the save succeeds; refresh the list in the background.
- Keep the existing all-or-nothing rollback and the clash check exactly as they are.

## 2) What each money figure means today (from the code)

| Figure | Definition | When it counts |
|---|---|---|
| Revenue | Line totals minus discount, **before tax**. Estimates and declined quotes never count. | On the invoice date, as soon as it's a real invoice (not when paid). Overpaid extra is included. |
| Tax collected | Shown separately, never revenue. | Same as revenue. |
| Cost of parts sold (COGS) | Quantity x the part cost saved on the invoice line. Old lines with no cost are flagged, not guessed. | With the invoice. |
| Expenses (overhead) | All expenses except part purchases and invoice-linked costs (those are stock, counted via COGS). | On the expense date, whether paid or not. |
| Payables | Unpaid or part-paid bills (expense or part purchase) - amount minus already paid. | From the moment the bill is created until fully paid. |
| Receivables | Invoice total minus payments, never below zero, excluding paid/estimate/declined. Overdue = past the due date. | Until fully paid. |

Gross profit = revenue - COGS. Net profit = gross profit - overhead.

**Fix: dashboard chart expenses.** The daily chart will show overhead only (leaving out part purchases and invoice-linked costs), the same rule the reports and profit figures use. The chart's revenue bars will also follow the new revenue timing rule below, so the dashboard, chart and reports all match.

### Is this the right accounting method?

Mostly yes. Revenue before tax, tax kept separate, cost of parts matched to the invoice that used them, and part purchases treated as stock rather than overhead are all standard.

**One thing to change: when revenue counts.** Right now revenue counts on the **invoice date** as soon as the invoice exists, even if it is still Open or In progress. Under normal accrual accounting, revenue counts **when the work is done**, whether or not it has been paid. That means:
- Open / In progress invoices: not revenue yet (work in progress).
- Completed, Partial or Paid invoices: revenue, dated the day the work was completed.
- Estimates / Declined: never revenue (no change).
- COGS moves with revenue, so parts cost counts on the same completion date.
- Receivables still include anything invoiced and unpaid.
- Expenses stay on their expense date (no change).

**How we'll do it:**
1. Save a "work completed on" date on each invoice, filled in automatically the first time it moves to Completed, Partial or Paid. Moving it back to Open or In progress clears it.
2. Fill in this date for existing invoices already Completed, Partial or Paid, using the invoice date (safest guess, since the real completion day was never recorded). You can adjust any invoice afterwards.
3. Dashboard, chart, Finance and all reports count revenue and COGS by this completion date and only for completed work.
4. Show the date on the invoice screen so staff can correct it if the job finished on another day.

Result: a big job invoiced this month but finished next month shows its revenue next month.

## Technical details
- Conflict: `PaymentsSection.persistInvoiceFields` returns the new `updated_at`; add an `onInvoiceSaved(updatedAt)` prop from `InvoiceForm` that calls `setLoadedUpdatedAt` and clears `changedElsewhere`. Realtime watcher unchanged otherwise.
- Speed: in `optimized-invoice-service.ts` batch `applyInventoryChanges` reads with `.in('id', ids)` and run updates via `Promise.all`; `Promise.all` for `linkSelectedTasks`/`syncLaborTasks`; in `payment-service.replaceInvoicePayments` run changed updates/inserts/deletes in parallel; in `InvoiceForm` navigate immediately and fire `fetchInvoiceById` without awaiting.
- Chart: `dashboard-service.fetchChartData` selects `category, invoice_id` on expenses and filters with `isInventoryOrJobCostExpense` to match `calculateProfitAndLoss`.
- Revenue timing: migration adds nullable `invoices.completed_at timestamptz`; trigger sets it (if null) when status enters completed/partial/paid and clears it on open/in-progress/estimate/declined; backfill `completed_at = date` for existing completed/partial/paid. Shared helper `isRecognizedRevenue(invoice)` + `revenueDate(invoice)` in `invoice-calculations.ts`, used by dashboard-service (query by `completed_at` range), FinancialReport, FinanceReport, Reports, InvoicingReport. Receivables logic unchanged. Editable date field in InvoiceForm for completed invoices.
- Verify: typecheck, build, and a before/after timing of the save path; manual test of add payment then Save (no warning) on an existing invoice.

## Testing after all changes
- Automated checks of the money math: revenue only for completed work, dated by completion; COGS on the same date; chart expenses exclude part purchases; receivables and payables unchanged.
- Database check: the completion date is set, kept, and cleared correctly when the status changes, and the backfill covered every completed/partial/paid invoice.
- Compare dashboard, chart, Finance and reports totals for the same period against a direct database calculation; they must match.
- Save-path checks: stock, payments, linked jobs and rollback give the same results as before, and saves take fewer server trips.
- Load every affected screen in the preview and confirm no errors.
- Limit: I can't sign in to your shop accounts here, so I'll give you a short click-through list (add a payment then save, over/under payment, complete an invoice, check the dashboard) for the signed-in steps.
