# Estimates (quotes) in the Invoices section

## Recommendation

Yes — adding an `estimate` status to invoices is the right call, rather than building a separate estimates module. An estimate is the same document as an invoice (customer, vehicle, parts, labor, tax, discount) with a different meaning, so reusing the invoice record means one form, one print view, and a one-click conversion with no data copying.

The important part is that estimates must not be treated as money owed. Today invoices are used for revenue, receivables and dashboard totals, so estimates need to be excluded from those.

## Current state

- `InvoiceStatus` in `src/types/index.ts` allows: `open`, `paid`, `partial`, `overdue`, `draft`, `in-progress`, `completed`.
- The database restricts the column further: `invoices_status_check` allows only `open`, `in-progress`, `completed`, `paid`, `partial` — so saving anything else fails today.
- The status dropdown (`InvoiceDetailsFields.tsx`) offers those same five options.
- Existing data: 104 open, 12 partial, 4 completed, 2 paid, 1 in-progress.

## Plan

### 1. Database
Replace the status check constraint on `invoices` to also allow `estimate` (and `declined` for estimates the customer turns down). No existing rows change.

### 2. Types and status display
- Add `estimate` and `declined` to `InvoiceStatus`.
- `StatusBadge`: estimate = neutral/slate badge labeled "Estimate"; declined = red badge.

### 3. Creating and editing
- New Invoice page gets a document-type choice at the top: **Invoice** or **Estimate** (estimate sets status to `estimate`).
- Status dropdown shows `Estimate` and `Declined` alongside existing options.
- While a record is an estimate, the payments section is hidden (you don't take payment on a quote).

### 4. Converting an estimate
- On the invoice detail page and in the invoices list, an estimate shows a **Convert to Invoice** action that flips status to `open` and stamps today's date (in the organization's timezone) as the invoice date.
- A **Mark Declined** action sets `declined`.

### 5. Keep estimates out of the numbers
Estimates and declined records are excluded from:
- Revenue and outstanding/receivables in `src/utils/invoice-calculations.ts`
- Dashboard metrics and revenue chart (`src/services/dashboard-service.ts`)
- Finance, Financial and Invoicing reports
- Overdue detection

They stay visible in the Invoices list, with the status filter gaining "Estimate" and "Declined" options plus a quick "Estimates" view.

### 6. Print / share
The printed document header reads "Estimate" instead of "Invoice" when the status is `estimate`, and shows "Quote valid for review — not a request for payment" instead of payment terms.

## Open choice

Estimates will keep the same ID/number after conversion (simplest, and preserves history). If you'd rather estimates use a separate numbering series (e.g. `EST-001` becoming `INV-014` on conversion), say so and I'll add a document-number field instead.

## Technical notes

Files touched: migration for the status constraint; `src/types/index.ts`, `src/components/StatusBadge.tsx`, `src/components/invoice/InvoiceDetailsFields.tsx`, `src/components/InvoiceForm.tsx`, `src/components/invoice/PaymentsSection.tsx`, `src/pages/NewInvoice.tsx`, `src/pages/InvoiceDetails.tsx`, `src/pages/Invoices.tsx`, `src/utils/invoice-calculations.ts`, `src/services/dashboard-service.ts`, and the report pages under `src/pages/reports/`. Existing invoice permissions (`PermissionGuard`) gate the new actions unchanged.
