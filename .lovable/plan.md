# Invoice page: customer/vehicle dropdowns + inline add

## What's happening

Confirmed from the code:

- The customers query in the data context selects rows with no sort order, so the list comes back in an arbitrary order from the database. A newly added customer can land anywhere in the dropdown instead of being visible near the top — the most likely reason it looks "missing". Row counts per organization are small (max 35), so this is not a query row limit.
- The invoice form reads customers only from the shared context. If the list in memory is stale (e.g. the customer was created in another tab or before the context refreshed), there is no way to refresh it from the invoice page — the "refresh" and "add" buttons next to the Customer label exist in the markup but are empty stubs that render nothing.
- Vehicles are fetched per customer, also unsorted, and the component caches the last loaded customer, so vehicles added elsewhere are not picked up until the customer selection changes.
- There is no "Add Customer" action on the invoice page at all. "Add Vehicle" exists but only appears after a customer is selected.

The exact "last customer never appears" claim is not fully confirmed as an ordering-only issue, so step 1 includes ordering plus an explicit refresh so the data is provably current.

## Changes

1. Sort and freshen the data
   - Order customers by `created_at` descending in the context load, so the newest customer is always at the top of the dropdown.
   - Order vehicles by `created_at` descending in the per-customer fetch.
   - On mounting the invoice form's customer/vehicle selector, always refresh customers once (not only when the list is empty), so a stale in-memory list can't hide a recent customer.

2. Restore a working refresh control
   - Replace the empty stub buttons next to the Customer label with a real refresh icon button that calls the customers reload and shows a spinner while loading.

3. Add customer inline from the invoice page
   - Add an "Add Customer" button next to the Customer dropdown that opens a dialog with the same fields used on the Customers page (name, email, phone, address).
   - On save: create the customer through the existing context `addCustomer`, then auto-select it in the dropdown and clear any vehicle selection.

4. Improve the existing Add Vehicle flow
   - Keep the existing vehicle dialog, but after saving, reset the internal "already loaded" cache so the refreshed vehicle list is always re-fetched and the new vehicle is auto-selected (already partly in place).
   - Show the Add Vehicle button in a disabled state with a hint tooltip before a customer is chosen, instead of hiding it, so users can see the option exists.

## Technical notes

- Files touched: `src/context/data/hooks/useCustomers.ts` (order by `created_at`), `src/context/data/hooks/useVehicles.ts` (order by `created_at`), `src/components/invoice/CustomerVehicleSelection.tsx` (refresh button, add-customer dialog, vehicle cache reset), plus a small new `src/components/customer/CustomerQuickAddDialog.tsx` reusing the existing form fields and shadcn dialog.
- No database or RLS changes are needed; `organization_id` continues to be handled server-side.
- No changes to invoice saving logic.
