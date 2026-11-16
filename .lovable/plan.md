# Stop work orders slipping back to "Approved" on save

## What I found
- Job c1c9e0a7 is saved right now as **Work completed** (last saved 11:40 UTC today), so it was put back after the slip.
- The job screen keeps the stage in two places: the stage picker and a second copy that the payments box reads. Two automatic "keep in step" rules copy the stage back and forth between them.
- Before the job finishes loading, both copies start as "Approved". If the rules run in the wrong order while it loads, "Approved" wins over the real stage. Update then saves "Approved". The earlier fix closed one path, but this copy-back loop is still there. This is the likely cause. I can't sign in to watch it happen, so it isn't confirmed.

## Fix
1. **One copy of the stage.** The stage picker becomes the only source. The payments box tells the screen when it changes the stage, and that only happens on invoices. Remove both copy-back rules.
2. **Save safety net.** When you press Update on a work order, the stage that gets saved is either:
   - the stage the job had when it opened, or
   - the stage you picked yourself in the Status dropdown.
   Anything the screen changes on its own is ignored, so a job can't fall back to "Approved" unless someone picks it.
3. **Test:** a work order opened as Work completed and saved without touching the Status dropdown stays Work completed. If the user picks Approved, it saves as Approved.

## Technical details
- InvoiceForm.tsx: drop the `useEffect` pair (status → form.setValue and form.watch('status') → setStatus). Pass `status` + an `onStatusChange` callback to PaymentsSection instead of using setValue('status').
- Add `userPickedStatusRef`, set only in the Status Select's onValueChange. In onSubmit for an existing work order: `effectiveStatus = userPickedStatusRef.current && isWorkOrder(status) ? status : savedStatus`.
- Pull that rule into a small pure helper in invoice-status.ts and cover it with a bun test.
