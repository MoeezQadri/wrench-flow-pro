# Deleting an invoice, and two people editing at once

## What happens today when an invoice is deleted

Confirmed from the delete routine in the invoice service:

- **Payments**: if any payment is recorded, the delete is refused with a message asking you to remove the payments first.
- **Parts / stock**: the parts on the invoice are added back into stock (and the invoice is removed from each part's usage list). Estimates and declined estimates are skipped, because they never took stock out.
- **Jobs (work orders)**: the jobs are kept, they just lose their link to the invoice. Hours, assigned technician and "completed" state stay as they were.
- **Purchase bills**: expenses that this invoice created for parts bought in are deleted.
- **Line items and the invoice** are then removed.
- Each step stops with a real error message if it fails, but there is no single all-or-nothing transaction, so a failure halfway can leave part of the work done.

## What happens today when two admins edit the same invoice

There is no protection at all. Saving overwrites the whole invoice: all line items are deleted and re-written, and payments are replaced with whatever the saving screen had loaded. So:

- The second person to press Save wins completely, silently.
- The first person's added lines disappear, because the second person's screen never saw them.
- Nobody is told anything happened.
- Stock movements are worked out from what each screen believed the invoice contained, so stock can end up wrong after a clash.

## What I propose to change

### Deleting

1. Keep the payment block (protects money reports) and keep returning parts to stock.
2. When jobs are unlinked, also make it visible: the confirmation dialog lists how many jobs will be released and how many parts go back to stock, with quantities, before you confirm.
3. Where a job was marked complete only because of that invoice's labour line, leave the job untouched but show it in the list of released jobs so it can be re-billed.
4. Make the whole delete one all-or-nothing operation so a mid-way failure cannot leave a half-deleted invoice.

### Two people editing

1. Detect the clash: when you save, if the invoice changed since your screen loaded it, the save is stopped and you see "This invoice was changed by someone else. Reload to see their version." with a Reload button. Nothing is overwritten.
2. Show it earlier too: while an invoice edit screen is open, a quiet banner appears the moment someone else saves that invoice.
3. Payments stop being wiped and re-created on every save; they are added, changed or removed individually, so a payment recorded by one person is never lost to another person's save.

## Technical notes

- `deleteInvoiceOptimized` in `src/services/optimized-invoice-service.ts`: move the sequence (stock restore, task unlink, expense delete, item delete, invoice delete) into a single `SECURITY DEFINER` Postgres function called via RPC so it is transactional; keep the payment guard and the `isNonStockStatus` skip. Add a companion read-only RPC returning the delete preview (parts + quantities, task count) for the confirmation dialog.
- Concurrency: use the existing `invoices.updated_at` as the version token. `updateInvoiceOptimized` sends `.eq('updated_at', loadedUpdatedAt)`; zero rows updated means a conflict, surfaced as a typed error the form renders as the reload prompt. `InvoiceForm` keeps the loaded `updated_at` in state and refreshes it after each successful save.
- Live notice: Supabase Realtime subscription on `invoices` filtered to the open invoice id, inside `useEffect` with `removeChannel` cleanup.
- Replace `replaceInvoicePayments` with a diff (insert new ids, update changed rows, delete removed ids) in `src/services/payment-service.ts`, so omitted arrays and concurrent additions cannot destroy payment rows.
- Stock changes for an edit are computed from the freshly-read database items rather than the form's loaded copy.
- No changes to invoice maths, permissions (delete stays owner/admin), layout or report formulas. Migration adds the two RPCs only; no table changes.
