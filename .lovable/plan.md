# Handling payments that are more or less than the invoice total

## How it works now (checked in the payments box)
- **More than due:** the payment is refused with "That is more than the amount still due". The invoice stays as it was.
- **Less than due:** the payment is saved and the invoice becomes **Partial**. You can't close it unless the rest is paid.
- **Exact amount:** the invoice becomes **Paid**.

## What changes

### 1. Customer pays more: accept it and show the change
- When the amount entered is more than what's still due, the app stops refusing it. It shows: "Received X. Due Y. Change to give back: Z."
- Only the amount due is saved as the payment, so revenue, reports and balances stay correct. The invoice becomes **Paid**.
- The note on the payment records the cash received and the change given, for example "Received 5,000, change 250".

### 2. Customer pays less: new "Close with discount" button
- When an invoice has a balance left over, a **Close with discount** button appears next to the balance.
- It asks you to confirm: "Give a discount of Z and mark this invoice Paid?"
- On confirm, the leftover amount is added to the invoice's fixed discount and the invoice is marked **Paid**. The invoice total, tax and reports all update through the usual invoice math.
- Only people allowed to edit invoices see this button. It doesn't appear on estimates, declined quotes or invoices that are already Paid.

### 3. Status saves right away
- On an existing invoice, a payment is already saved immediately. After this change, the new Paid or Partial status and any discount are also saved immediately. Right now the status only changes on screen until the invoice itself is saved.
- Removing a payment works the same way and uses the same small rounding tolerance, so a tiny rounding difference no longer leaves an invoice open.

## Technical details
- `src/components/invoice/PaymentsSection.tsx`:
  - Replace the overpayment refusal with change handling: cap the saved amount at the amount due and put the change in the notes.
  - Add the "Close with discount" action. It sets `discount_type` to `fixed` and increases `discount_value` by the remaining balance, working back from the tax, since tax is charged on the discounted amount: `extraDiscount = balance / (1 + taxRate/100)`. If a percentage discount is already set, convert it to its fixed amount first.
  - Use a 0.005 tolerance for status in both add and remove.
- Save status and discount straight to the invoice after a payment action, using the existing optimistic-lock update, so the form and the saved record never disagree.
- No database changes.
