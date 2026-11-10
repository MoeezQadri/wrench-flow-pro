# Fix status reset, vendor list, missing payment; add owner payouts

## 1. Work orders jumping back to Approved
All 4 jobs you named (9128e04e, c11e64d1, ac45f826, 7d95837b) are saved as Approved now.

Cause found: when a work order opens, the screen loads the real stage (e.g. Work in progress). But a second piece of the screen still holds the starting value "Approved" for a moment and copies it back over. The dropdown then shows Approved, and pressing Update saves Approved. It happens every time you open and save, so the stage keeps flipping back.

Fix: the stage only gets copied from the payments box when that box actually changes it (it does this for invoices, not work orders), never on load. After that, open a job set to Work in progress, press Update, and it stays Work in progress.

After the fix you'll need to set these jobs back to the right stage once. I can't tell from the records which stage each one should be.

## 2. Owner payouts (owner drawings)
GaragePro has no place for this today. Right now the only choice is entering it as an expense, which is wrong: it would lower your profit.

Add **Owner drawings** under Finance:
- Record date, amount, owner name, payment method and a note. Owner/admin only.
- Not an expense: profit, revenue and costs stay the same.
- Shown in the Finance report as its own line: "Net profit" first, then "Owner drawings", then "Retained in business".
- Edit and delete, with owner/admin only.

## 3. Vendor list empty in Add Expense
Cause: the expense form takes a copy of the vendor list once, when it opens. If the vendors are still loading at that moment, the copy stays empty. Fix: keep the list in step with the loaded vendors, and still add newly created vendors to it.

## 4. Payment on 7d95837b not showing
The payment of 89,500 (10 Nov, 10:29) is saved on the job, so no money was lost. It just doesn't show when you open the job again.

Step 1 is to check where the edit screen gets its payment list. Two likely causes: it reads an old copy of the job list from before the payment, or the 0-total advance rule still drops it there. Then I'll fix it so the edit screen always loads payments fresh from the saved records. I'll also check this with an empty work order and with one that has lines.

## Technical details
- InvoiceForm.tsx: the `formStatus` → `setStatus` effect races with the load effect (the form's default status is 'approved'). Replace it with an explicit `onStatusChange` callback from PaymentsSection, or skip it until `initialDataLoaded` and only when `form.getValues('status')` differs because of a payment action.
- ExpenseForm.tsx: replace `useState(vendors)` with a derived list (`vendors` merged with locally added vendors).
- New `owner_drawings` table: grants, RLS by `current_user_org()`, owner/admin write, `set_row_org_id` trigger. Finance page tab plus a FinanceReport line, without touching `calculateInvoiceBreakdown` or the expense totals.
- Payment reload: the EditInvoice/InvoiceFormWithLoader data source; fetch `payments` by invoice_id on load.
- Tests: a status stays work_in_progress after load and save; drawings are kept out of net profit.
