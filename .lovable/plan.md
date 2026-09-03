# Parts Inventory: hide selling price and margin

Selling price varies per invoice, so showing a single selling price and margin on the inventory list is misleading. The Parts page becomes a purchase-cost view.

## What changes (Parts Inventory page only)

- Grid cards: remove the "Selling Price" and "Margin" fields. Keep Quantity, Purchase Cost, Vendor, stock badge, and assignment status.
- List rows: remove the "Selling Price" and "Margin" entries. Keep Qty, Cost, Vendor.
- Sort dropdown: remove "Selling Price" and "Margin" options; keep Name, Quantity, Purchase Cost, Vendor, Part Number. "Purchase Cost" stays labelled clearly as cost.

## What stays unchanged

- The part's stored price field and the Add/Edit Part form are untouched, so the price still acts as the default suggestion when a part is added to an invoice.
- Invoice line items keep their own editable selling price and the cost snapshot, so revenue, COGS, and margin reporting are unaffected.

## Technical notes

Change is confined to `src/pages/Parts.tsx`: the two render blocks (grid and list) and the `sortBy` select options plus the corresponding `price`/`margin` cases in the sort comparator.
