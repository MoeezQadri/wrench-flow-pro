# Handling payments that are more or less than the invoice total

## How it works now (checked in the payments box)
- **More than due:** the payment is refused with "That is more than the amount still due". The invoice stays as it was.
- **Less than due:** the payment is saved and the invoice becomes **Partial**. You can't close it unless the rest is paid.
- **Exact amount:** the invoice becomes **Paid**.

## What changes

### 1. Customer pays more: confirm the change, then record it all as revenue
- First attempt: a dialog appears saying "Received X. Amount due: Y. Change to give back: Z." and asks to confirm.
- On confirm, the **full amount entered** is saved as the payment — nothing is capped. The invoice becomes **Paid**.
- The extra money counts as revenue: the payment total is higher than the invoice total, and reports treat the difference as overpayment income. The payment note records the change given, for example "Received 5,000, change 250".
- Existing guards stay in place: double-click protection, zero/negative amounts refused, no payments on empty invoices.

### 2. Customer pays less: new "Close with discount" button
- When an invoice has a balance left over, a **Close with discount** button appears next to the balance.
- It asks you to confirm: "Give a discount of Z and mark this invoice Paid?"
- On confirm, the leftover amount is added to the invoice's fixed discount and the invoice is marked **Paid**. The invoice total, tax and reports all update through the usual invoice math.
- Only people allowed to edit invoices see this button. It doesn't appear on estimates, declined quotes or invoices that are already Paid.

### 3. Status saves right away — and nothing that works today breaks
- On an existing invoice, a payment is already saved immediately. After this change, the new Paid or Partial status and any discount are also saved immediately. Right now the status only changes on screen until the invoice itself is saved.
- Removing a payment works the same way and uses the same small rounding tolerance, so a tiny rounding difference no longer leaves an invoice open.
- Exact-amount payments, partial payments, the new-invoice screen, and the existing overpayment guard for unconfirmed amounts all keep working as they do now.

## Technical details
- `src/components/invoice/PaymentsSection.tsx`:
  - Replace the overpayment refusal with a confirm dialog (shadcn AlertDialog). On confirm, save the full entered amount and mark Paid; add the change note.
  - Add the "Close with discount" action. It sets `discount_type` to `fixed` and increases `discount_value` by the remaining balance, working back from the tax, since tax is charged on the discounted amount: `extraDiscount = balance / (1 + taxRate/100)`. If a percentage discount is already set, convert it to its fixed amount first.
  - Use a 0.005 tolerance for status in both add and remove.
- Save status and discount straight to the invoice after a payment action, using the existing optimistic-lock update, so the form and the saved record never disagree.
- `calculateInvoiceBreakdown` already derives totals from payments, so overpayment flows into revenue without new math; `calculateBalanceDue` stays clamped at 0 so overpayments never distort receivables.
- No database changes.
