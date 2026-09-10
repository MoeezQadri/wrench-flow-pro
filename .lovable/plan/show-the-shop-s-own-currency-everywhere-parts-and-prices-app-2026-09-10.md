# Show the shop's own currency everywhere parts and prices appear

## What I found

A few money figures are still printed with a hard-coded dollar sign instead of the organization's chosen currency. The rest of the app already uses the shared currency formatter.

Places still showing `$`:

1. **Workshop parts/labour picker inside an invoice** (`src/components/invoice/WorkshopPartsSelector.tsx`) — the parts price column, the parts running total, the labour price column and the labour running total.
2. **"Assign part to invoice" popup** (`src/components/part/AssignToInvoiceDialog.tsx`) — the "Stock … Price: $…" summary line.
3. **"Assign task to invoice" popup** (`src/components/task/AssignToInvoiceDialog.tsx`) — the "Price: $…" summary line.
4. **Invoice discount fields** (`src/components/invoice/InvoiceDetailsFields.tsx`) — the "Fixed Amount ($)" option and the "Discount Amount ($)" label.

Already correct (no change needed): parts list, part add/edit form, payment dialogs, bills and vendor screens, task form.

## Changes

- In each of the four files, read the organization currency through the existing `useOrganizationSettings()` hook.
- Replace `$` + `toFixed(2)` output with the shared currency formatter, so a shop set to rupees, pounds or euros sees its own symbol and number style.
- Replace the two discount labels with the organization's currency symbol.

No changes to any amounts, totals, tax, discount or profit maths — display only.

## Checking it

- Confirm no remaining hard-coded `$` in the parts, invoice, task, expense and payable components.
- Open the invoice parts picker, the assign-to-invoice popups and the discount fields to confirm the correct symbol shows.
- Run the type check and build.
