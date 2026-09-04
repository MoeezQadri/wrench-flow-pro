# Fix invoice/estimate item saving: lost custom items, phantom invoices, parts landing only in inventory

## What the data shows

I inspected the code and queried your live database. Findings:

- 19 parts sit in inventory whose "used on invoice" reference points at a real invoice that has **no matching line** for them. Example: invoice `627e9df9…` (created 3 Sep 14:28) has **zero** line items, yet four parts were created against it between 14:35 and 14:46 — "Car stopper / fuel in bike", "Ride dha to ghg", etc. That is exactly your "parts go to Parts, not to the invoice" report, with evidence.
- Several near-identical invoices for the same customer + vehicle were created within minutes of each other on 3 Sep and 11 Aug, most with **0 line items** — the "update generated a new invoice" symptom.
- 9 labor lines have no linked task, and 3 part lines have no linked part, so some custom items were only half-saved.

## Confirmed causes

1. **Parts are created before the invoice is saved.** When editing an invoice, adding a "part" line immediately writes a new `parts` row (plus a purchase expense) and only then hands the line to the form. If the save afterwards fails, is abandoned, or the line is dropped by the diff (below), the part stays in inventory and never appears on the invoice. Repeating the attempt creates another part each time (there are 6 identical copies of one part name in your data).
2. **The item diff loses and duplicates lines.** Saving an existing invoice matches old rows to new lines by "same part / same task / same description+type" instead of by the row's real ID. Consequences: editing a line's description deletes the old row and inserts a new one; two lines with the same description collapse into one; and the update writes only description, quantity, price, cost, type and unit — it never writes `part_id`, `task_id`, `custom_part_data` or `custom_labor_data`. So custom-part details, mechanic assignment, hours and billing type entered on an existing line are silently discarded.
3. **New invoices behave differently from edited ones.** On a brand-new invoice the item dialog has no invoice ID yet, so no part row and no purchase expense are created at all, and the flag that would create them server-side is hard-coded off. Custom parts added at creation time therefore never reach inventory, vendor dues or cost reporting — the opposite inconsistency from editing.
4. **Inventory can drift.** Every save first restores stock for all existing part lines, then deducts again for the current lines. A partial failure between those two steps leaves quantities wrong, and estimates deduct stock even though nothing has been consumed yet.

The exact origin of the extra **empty** invoice rows is not yet proven (creation is supposed to reject an invoice with no items), so verifying it by reproducing the flow is the first step rather than an assumption.

## The fix

**Step 1 — Reproduce and confirm the phantom-invoice path.** Drive the real app through: create invoice with a custom part, edit it, add a part, save twice, then the same for an estimate. Record which requests are sent. This confirms cause of the empty rows before changing that path.

**Step 2 — Make items save by identity.**
- Carry the real database row ID on each line in the form (loaded on edit, returned after insert).
- Rewrite the item diff to match on that row ID; only fall back to part/task matching for lines that have never been saved.
- Include every column in updates: `part_id`, `task_id`, `unit_of_measure`, `creates_inventory_part`, `creates_task`, `custom_part_data`, `custom_labor_data`, cost and price.
- Allow two lines with the same description to coexist (stop the merge-by-description behaviour for saved rows).

**Step 3 — Stop creating parts before the invoice line is saved.**
- The item dialog no longer writes to `parts` or `expenses`. It only builds the line, carrying its custom part details and a "create inventory part" flag.
- Inventory part creation plus the vendor purchase expense happen once, server-side, when the invoice/estimate is saved — identically for new and edited documents — and the created part ID is written back onto the line so a second save updates instead of duplicating.
- Guard against duplicates by looking for an existing part with the same name/part number in the organization before inserting.

**Step 4 — Correct stock and estimate handling.**
- Replace restore-then-deduct with a net adjustment per part computed from the difference between saved and submitted quantities, so a failure mid-save can't double count.
- Estimates (and declined estimates) do not deduct stock or create purchase expenses; stock is deducted when the estimate becomes a real invoice.

**Step 5 — Fail loudly instead of silently.** Item, part, task and expense errors during a save surface as an error toast and keep the user on the form, rather than being logged to the console while the invoice reports success.

**Step 6 — Test matrix (browser-driven, against the live preview).**
- New invoice: custom part, existing inventory part, custom labor with mechanic + hours, lumpsum labor, "other" line.
- Edit invoice in each state: open, in-progress, partial, estimate — change quantity, change price, rename a line, delete a line, add a line, save twice in a row.
- Verify after each save: line count and values match the form, exactly one part/task row per custom line, stock moves once, vendor dues get one expense, no extra invoice rows appear.
- Estimate specific: no stock movement, no expenses, converting to invoice applies both once.

**Step 7 — Clean up existing bad data** (separate, reported to you first): list the empty invoices and the orphaned zero-quantity parts created from invoices so you can confirm before anything is deleted or relinked. No destructive cleanup without your go-ahead.

## Technical notes

- Files: `src/components/invoice/InvoiceItemForm.tsx` (stop side-effect writes), `src/services/smart-invoice-service.ts` (ID-based diff, full column set), `src/services/optimized-invoice-service.ts` (net stock adjustment, part/expense creation, estimate rules, error propagation), `src/components/InvoiceForm.tsx` (carry row IDs, surface failures), `src/context/data/hooks/useInvoices.ts` (return saved lines with IDs).
- `src/services/invoice-service.ts` holds a second, unused copy of this logic; it will be removed or aligned so there is one save path.
- No schema change is expected; `invoice_items` already has the needed columns.
