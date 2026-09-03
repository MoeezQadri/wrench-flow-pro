# Part Cost vs Price: Margins, Expenses and Vendor Dues

## Current state (verified)

- The `parts` table has a single `price` column — there is no cost field anywhere, for inventory parts or invoice parts.
- When a part is added (inventory form or directly on an invoice), the app creates an expense using `price × quantity`, i.e. the **selling** price is booked as the cost.
- Those expenses are created with `payment_status: 'paid'`, and the database trigger only creates a payable when the status is not paid — so **no part purchase ever appears in vendor dues**.
- Reports have no cost-of-parts or gross-margin figure; revenue comes from invoice totals only.

## What will change

**1. Parts get a purchase cost**
- New `cost` field on parts (cost per unit), entered when stocking/purchasing a part.
- Selling price stays separate and is chosen at invoicing time.
- Inventory list shows Cost, Price and Margin per part.

**2. Invoice parts**
- Selling price remains fully editable on the invoice line (any price the user wants).
- Cost is **inherited from inventory** — not editable on the invoice line, shown read-only for reference.
- For a part created on the fly from an invoice, the form asks for the purchase cost (used for the vendor expense) and the invoice price separately.
- Each invoice part line stores a cost snapshot so historical margins stay accurate when part cost changes later.

**3. Vendor dues (payables)**
- Part purchases now default to **unpaid**, so every purchase with a vendor creates a payable and shows up in vendor dues until marked paid.
- Expense amount uses `cost × quantity` instead of selling price.
- Existing "Mark as paid" flow on expenses/payables settles them; no new UI needed there.

**4. Cost and revenue figures**
- Cost of parts sold (COGS) is calculated from the invoice line cost snapshots.
- Financial report gains Parts Cost and Gross Profit / Margin alongside revenue, using the existing billable-invoice rules (estimates and declined documents excluded).
- Vendor/payables totals include the new unpaid part purchases.

Applies to both workshop/inventory parts and parts added inside an invoice.

## Technical detail

Migration:
- `ALTER TABLE public.parts ADD COLUMN cost numeric NOT NULL DEFAULT 0;`
- `ALTER TABLE public.invoice_items ADD COLUMN cost numeric NOT NULL DEFAULT 0;`
- Backfill: set `parts.cost = price` for existing rows so nothing reports a 100% margin (one-time data update).

Code:
- `src/types/index.ts` — add `cost` to `Part` and `InvoiceItem`.
- `src/components/part/PartForm.tsx` / `PartDialog.tsx` — add Cost per unit input (required when a vendor purchase is recorded); expense amount becomes `cost × quantity`, `payment_status: 'unpaid'` so the payable trigger fires.
- `src/components/invoice/InvoiceItemForm.tsx` — for existing parts, pull `cost` from the selected part into the line; for newly created parts, capture purchase cost and use it for the expense (unpaid) while `price` stays the invoice price; persist `cost` on the invoice item.
- `src/services/optimized-invoice-service.ts` and `src/services/invoice-service.ts` — persist/read `invoice_items.cost`.
- `src/services/inventory-sync-service.ts` — keep the part cost intact on quantity sync.
- `src/pages/Parts.tsx` — Cost / Price / Margin columns.
- `src/utils/invoice-calculations.ts` — add a parts-cost helper per invoice.
- `src/pages/reports/FinancialReport.tsx` (and FinanceReport where revenue is displayed) — Parts Cost, Gross Profit, Margin cards.

Notes:
- Payment method on auto-created part expenses becomes irrelevant until settlement; it will be recorded when the payable is paid.
- Labor/task costing is unchanged in this plan.
