# Fix: bank transfer payments not saved on invoice update

## What's actually wrong

Two confirmed issues, both found by reading the code and the database:

1. **Wrong value for bank transfer.** The invoice payment form sends `bank_transfer` (underscore), but the `payments` table has a check constraint that only accepts `cash`, `card`, `bank-transfer` (hyphen). Any bank-transfer payment is rejected by the database. The rest of the app (expenses, payables) already uses the hyphen form. There are currently zero bank-transfer rows in the payments table — only `cash` and `card`.

2. **On "Update invoice", payments are never saved at all.** The edit path in the invoice form explicitly strips payments out of the data before saving, and the update service does not touch the `payments` table. So edits to payments (of any method) are silently lost — new invoices do save payments.

## Fix

1. Use `bank-transfer` as the value in the invoice payment method dropdown, and accept both spellings when displaying an existing payment's method (so any older data still renders correctly) in the payments section and the invoice details page.
2. Persist payments on invoice update: after the invoice record is updated, sync the payment rows for that invoice (remove deleted ones, insert new ones) instead of discarding them.
3. Broaden the allowed payment methods for invoice payments so `check` and `other` also work, matching the dropdowns used elsewhere in the app.

## Technical detail

- `src/components/invoice/PaymentsSection.tsx` — change the `SelectItem` value to `bank-transfer`; label lookup handles both `bank-transfer` and legacy `bank_transfer`.
- `src/pages/InvoiceDetails.tsx` — same label handling.
- `src/services/optimized-invoice-service.ts` — in `updateInvoiceOptimized`, replace the invoice's payment rows using the existing `paymentService.replaceInvoicePayments` helper, and return the saved payments instead of `payments: []`.
- `src/components/InvoiceForm.tsx` — stop stripping `payments` from the update payload.
- Migration: widen `payments_method_check` to `('cash','card','bank-transfer','check','other')`.
