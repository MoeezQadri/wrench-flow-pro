# Make customer email & address optional (phone required)

## Context
The customer form (`src/pages/Customers.tsx`) and quick-add dialog (`src/components/customer/CustomerQuickAddDialog.tsx`) currently treat email and address as required. The database `customers` table already stores `email`, `phone`, and `address` as nullable `text` columns, and the TypeScript `Customer` type already marks `email?` and `address?` optional — so **no database or type changes are needed**. This is a frontend validation + label change only.

## Changes

### 1. `src/pages/Customers.tsx` — main add-customer dialog
- **Zod schema**: make `email` and `address` optional (use `.optional().or(z.string().email())` for email so a value, if entered, is still validated as an email). Keep `phone` required with `min(7)`.
- **Labels**: change `Email *` → `Email`, `Address *` → `Address`. Keep `Name *` and `Phone *`.
- Update the `CustomerFormValues` type so `email` and `address` are `string` (form still collects empty strings, which is fine for nullable columns).

### 2. `src/components/customer/CustomerQuickAddDialog.tsx` — inline quick-add
- Make `phone` required: add a `if (!phone.trim()) { toast.error("Phone number is required"); return; }` guard and change label `Phone` → `Phone *`.
- Email and address are already optional with no asterisk — no change needed there.

## Notes
- No migration: the `customers` table columns are already nullable.
- Empty email/address will be saved as empty strings, which the existing list/search/detail views already handle.
