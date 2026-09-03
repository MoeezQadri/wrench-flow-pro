# Parts Inventory: hide selling price and margin

Selling price varies per invoice, so showing a single selling price and margin on the inventory list is misleading. The Parts page becomes a purchase-cost view.

## What changes (Parts Inventory page only)

- Grid cards: remove the "Selling Price" and "Margin" fields. Keep Quantity, Purchase Cost, Vendor, stock badge, and assignment status.
- List rows: remove the "Selling Price" and "Margin" entries. Keep Qty, Cost, Vendor.
- Sort dropdown: remove "Selling Price" and "Margin" options; keep Name, Quantity, Purchase Cost, Vendor, Part Number.

## Profitability check (answer to your second question)

Verified how the numbers are produced today:

- Profit and margin come only from invoice lines, not from the inventory record. `calculateInvoiceBreakdown` computes revenue from each line's own `price` and parts cost from each line's own `cost` snapshot, so a part sold at different prices on different invoices is reported correctly per invoice.
- No code substitutes cost for price or price for cost. Every persistence path writes `cost: item.cost || 0`, and price is stored as entered; there is no `price || cost` fallback anywhere in the services or the calculation utility.
- An empty selling price on an invoice line becomes 0 revenue (not the cost value), and an empty purchase cost becomes 0 cost. Both fields are marked required in the invoice line form, so blanks are only possible if a value is explicitly cleared to zero.

No changes are needed for profitability; the inventory `price` remains only a convenience default that pre-fills the invoice line and stays editable there.

## Technical notes

Change is confined to `src/pages/Parts.tsx`: the grid and list render blocks, the `sortBy` select options, and the corresponding `price`/`margin` cases in the sort comparator.
