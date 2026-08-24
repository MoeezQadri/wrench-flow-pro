# Organization Tax Rate & Timezone

## Why you see a default tax rate today
The invoice form hardcodes `7.5%` as the starting tax rate — it is not read from anywhere. There is no tax setting in the app today.

## Why dates look shifted
Invoice dates are stored as full timestamps, but the form submits only a plain date (`YYYY-MM-DD`), which gets interpreted as midnight UTC. Screens then render it with `toLocaleDateString()` in the *viewer's* browser timezone, so an invoice created late in the day (or viewed from a different timezone) can show the previous or next day. Payment dates and "created at" times have the same issue.

## What will change

### 1. Organization settings (Owner/Admin only)
Two new fields in Organization Settings:
- **Default Tax Rate (%)** — used as the starting tax rate for every new invoice.
- **Timezone** — a searchable picker, prefilled from the selected Country (editable afterwards). All invoice/payment dates and times are displayed in this timezone.

Both fields are only editable by Owner and Admin; other roles see them read-only.

### 2. Invoices
- New invoices start with the organization's default tax rate instead of 7.5. It stays editable per invoice.
- After saving the tax setting, an optional prompt lets you apply the new rate to existing unpaid invoices (open, in-progress, completed, partial). Paid invoices are never touched.
- Invoice dates, payment dates, and timestamps are formatted in the organization's timezone everywhere they appear (invoice list, invoice details, printed/PDF view, reports, dashboard).

## Technical notes
- Migration: add `default_tax_rate numeric not null default 0` and `timezone text` to `public.organizations`. Existing update policy already restricts writes to the org; the settings form additionally gates the two fields on the Owner/Admin role, so no policy change is needed for that.
- Bulk re-apply runs as a scoped update over the current org's non-paid invoices, executed from the settings action after explicit confirmation.
- New `src/utils/datetime.ts` with `formatOrgDate`, `formatOrgDateTime`, and `toOrgDayStart` helpers built on `date-fns-tz`, reading the timezone from the organization context (fallback: browser timezone).
- Invoice save path normalizes the picked calendar day to noon in the org timezone before storing, so the stored timestamp always renders as the same day.
- Country → timezone defaults come from a small map extended onto the existing `GLOBAL_COUNTRIES` list in `src/utils/global-data.ts`.
- Replace direct `new Date(...).toLocaleDateString()` calls in `src/pages/Invoices.tsx`, `src/pages/InvoiceDetails.tsx`, and the invoice print/PDF components with the new helpers.
