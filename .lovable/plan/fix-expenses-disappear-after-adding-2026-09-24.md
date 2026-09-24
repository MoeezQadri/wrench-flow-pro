# Fix: expenses disappear after adding

## What is happening (confirmed)
The expenses table only accepts the payment states "paid", "pending" or "overdue". The app saves a new expense as "unpaid", so every new expense is refused when it is saved. The expense form doesn't wait for the save to finish: it shows "added successfully" and closes straight away. So the expense seems to go in, then it's gone.

The same rule also blocks:
- bills created automatically when you add a part with a purchase cost
- vendor expenses created from custom invoice lines
- marking a bill as partly paid (the app saves this as "partial")

## Changes
1. Update the rule so the expenses table also accepts "unpaid" and "partial". Existing rows stay the same, and no amounts or formulas change.
2. The expense form waits for the save to finish. It only shows "added" and closes when the save works. If the save fails, the form stays open with your entries still in it, and a message explains what went wrong.
3. Remove the second "added successfully" message, so you see just one confirmation.

## Test
- Add a workshop expense and an invoice expense (today's date and an earlier date). Both show in the list, and each creates a bill in Payable Management.
- Record a part payment on a bill. It saves as Partial. Then pay off the rest, and it shows Paid.
- Add a part with a purchase cost. Its bill shows up.
- Force a failed save and check that the form stays open with a clear message.

## Technical details
- Migration: drop `expenses_payment_status_check` and recreate it as `CHECK (payment_status IN ('paid','pending','overdue','unpaid','partial'))`.
- Check that `handle_expense_payable` / `handle_expense_payment_update` treat 'unpaid'/'partial' as not paid (the insert trigger already treats anything other than 'paid' as pending).
- `ExpenseDialog.handleSubmit`: `await onSave(...)` (change the prop type to return a Promise), and close or toast only on success. `Expenses.handleSaveExpense` rethrows the error after its toast. Remove the duplicate success toast in `useExpenses.addExpense`.
