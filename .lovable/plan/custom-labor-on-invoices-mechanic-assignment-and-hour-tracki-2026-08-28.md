# Custom labor on invoices: mechanic assignment and hour tracking

## How it works today

When you add a **custom labor** line to an invoice, the app always creates a matching task (one per line, linked back through the invoice item so repeated saves update instead of duplicating). That task is created with:

- No mechanic assigned (`mechanic_id` is empty) — so it shows as unassigned in Tasks and never appears in mechanic performance.
- Status forced to `completed`, with `completed_at` set to the save time.
- `hours_estimated` and `hours_spent` both set to the line quantity (or `1` for lumpsum), so "hours spent" is really just the billed quantity, not measured work.

So today: the mechanic is not assigned from the invoice at all, and hours are inferred from billing rather than tracked. To assign someone or log real hours you have to open the Tasks page afterwards and edit the task (mechanic assignment and check-in/out already exist there).

## Proposed change

Make the invoice labor line carry the same task fields the Tasks page uses, so a labor line is a real, trackable task from the moment it is created.

In the custom labor section of the invoice item dialog, add:

1. **Assigned Mechanic** dropdown (optional, "Unassigned" default) using the existing mechanics list.
2. **Status** selector: "In Progress" (default when a mechanic is assigned) or "Completed".
3. **Hours** handling:
   - Hourly billing: billed quantity stays the billed hours; add a separate optional **Hours Spent** field, defaulting to the billed quantity.
   - Lumpsum: quantity locked to 1 as today, with **Estimated Hours** and **Hours Spent** inputs so mechanic time is still tracked while the fee stays flat.

These values are stored on the invoice item's labor data and passed through to the task on save, so:

- The task appears in Tasks assigned to the chosen mechanic.
- `completed_at` is only set when status is Completed.
- Hours spent reflect what was entered rather than the billing quantity, so mechanic performance and reports are accurate.
- Editing the invoice line updates the same task; the mechanic can still refine hours via check-in/out on the Tasks page, and later invoice saves will not stomp a manually tracked value unless the invoice field is changed.

## Technical notes

- `src/components/invoice/InvoiceItemForm.tsx`: add mechanic/status/hours controls for `type === 'labor'`; extend `custom_labor_data` with `mechanic_id`, `status`, `hours_estimated`, `hours_spent`.
- `src/services/optimized-invoice-service.ts` (`syncLaborTasks`): read those fields into the task payload instead of hardcoding `status: 'completed'` and quantity-derived hours; set `completed_at` conditionally; preserve existing `hours_spent` on update when the invoice value was not explicitly set.
- `src/services/invoice-service.ts`: mirror the same payload for the legacy path.
- `src/types/index.ts`: widen the labor data type.
