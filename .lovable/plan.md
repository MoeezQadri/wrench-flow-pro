# Labor items: always record the task (remove the opt-in checkbox)

## What's happening today

When you add a **labor** line to an invoice, there is a checkbox labelled "Save to tasks database". Unless you tick it, no task row is ever written — the labor only exists as an invoice line. That's why labor work never shows up in the Tasks tab or in mechanic/task reports.

Parts behave the opposite way: a part line is always written to inventory, no checkbox involved. So the labor checkbox is an inconsistency, not a deliberate rule.

Two more problems in the current labor path:

1. **New invoices** — when adding items to an invoice that hasn't been saved yet, there is no invoice ID, so the checkbox label literally reads "(no invoice ID available)" and the client skips task creation. The task only gets created later by the server pass, which is confusing and invisible to the user.
2. **Duplicates on edit** — on an existing invoice, ticking the box creates the task immediately from the dialog, and then every subsequent "Update Invoice" runs the server-side item pass, which creates *another* task for the same labor line because it only checks the `creates_task` flag, not whether a task already exists.

## Recommendation

Drop the checkbox and make labor behave like parts: **every labor line is recorded as a task tagged to its invoice**, created exactly once, at invoice save time.

- Remove the "Save to tasks database" checkbox from the invoice item dialog. Keep the labor rate field visible for all labor lines (it feeds the task record and the reports).
- Labor lines picked from an existing task keep pointing at that task — no new task is created, the existing one is linked to the invoice (that already works).
- New custom labor lines get a task created server-side during invoice create/update, so it works identically for new and existing invoices.
- Make creation idempotent: if the line already has a `task_id`, update that task instead of inserting a new one, and write the resulting `task_id` back onto the invoice item. This kills the duplicate-task-per-save behaviour.

Net effect: labor entered on an invoice always shows in the Tasks tab and in task/mechanic reporting, with no duplicates and nothing for the user to remember to tick.

## Technical detail

- `src/components/invoice/InvoiceItemForm.tsx` — remove the `createsTask` checkbox and state; always set `creates_task: true` and `custom_labor_data` (labor rate) for labor lines with no `selectedTaskId`. Remove the client-side `addTask` call so creation happens in one place only.
- `src/services/optimized-invoice-service.ts` (`processItemUpdatesOptimized`) — for labor lines: if `item.task_id` exists, update that task (title, hours, price, labor rate, `invoice_id`); otherwise insert a new task and persist the new id onto the matching `invoice_items` row so later saves update rather than insert.
- `src/services/invoice-service.ts` (`updatePartsAndTasksForInvoice`) — apply the same "update if `task_id` exists" guard so the legacy path can't duplicate either.
- No schema change needed: `tasks.invoice_id`, `invoice_items.task_id`, `labor_rate`, and `skill_level` already exist, and `organization_id` is set by the existing DB trigger.

## Optional follow-up (say the word if you want it)

Clean up any duplicate tasks the old behaviour already created — same title, same `invoice_id`, keeping the earliest row.
