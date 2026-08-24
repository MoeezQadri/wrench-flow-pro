# Invoice page: customer/vehicle dropdowns + inline add

## What's happening

Confirmed from the code:

- The customers query in the data context selects rows with no sort order, so the list comes back in an arbitrary order from the database. A newly added customer can land anywhere in the dropdown instead of being visible near the top — the most likely reason it looks "missing". Row counts per organization are small (max 35), so this is not a query row limit.
- The invoice form reads customers only from the shared context. If the list in memory is stale (e.g. the customer was created in another tab or before the context refreshed), there is no way to refresh it from the invoice page — the "refresh" and "add" buttons next to the Customer label exist in the markup but are empty stubs that render nothing.
- Vehicles are fetched per customer, also unsorted, and the component caches the last loaded customer, so vehicles added elsewhere are not picked up until the customer selection changes.
- There is no "Add Customer" action on the invoice page at all. "Add Vehicle" exists but only appears after a customer is selected.

The exact "last customer never appears" claim is not fully confirmed as an ordering-only issue, so step 1 includes ordering plus an explicit refresh so the data is provably current.

## Changes

1. Replace the customer dropdown with a searchable picker
   - Swap the plain `Select` for a searchable combobox (shadcn Command inside a Popover) on the invoice page.
   - It shows a short recent list by default (newest 20 customers by `created_at`), so no full list is loaded up front.
   - Typing searches the database directly: a debounced (~300ms) query against `customers` filtered by the current organization, matching name, phone, or email (case-insensitive), limited to 20 results. Results are not limited to whatever is already cached in memory, so any customer can be found even if not in the loaded list.
   - Selecting a customer from search results merges it into the in-memory list so it renders correctly and stays selected.
   - When editing an existing invoice, the selected customer is fetched by ID if not present locally, so the name always displays.

2. Same treatment for vehicles
   - Vehicles are fetched per customer and ordered by `created_at` descending, newest first.
   - If a customer has more than a handful of vehicles, the vehicle field also uses a searchable picker matching make, model, or license plate; small lists keep the simple dropdown behaviour.

3. Add customer inline from the invoice page
   - Add an "Add Customer" button next to the customer picker that opens a dialog with the same fields used on the Customers page (name, email, phone, address).
   - On save: create the customer via the existing context `addCustomer`, auto-select it, and clear any vehicle selection.

4. Improve the existing Add Vehicle flow
   - Keep the existing vehicle dialog; after saving, reset the internal "already loaded" cache so the vehicle list is re-fetched and the new vehicle is auto-selected.
   - Show the Add Vehicle button disabled with a hint before a customer is chosen, instead of hiding it, so the option is discoverable.

## Technical notes

- New search helpers: `searchCustomers(term)` in `src/context/data/hooks/useCustomers.ts` and `searchVehicles(customerId, term)` / ordering in `src/context/data/hooks/useVehicles.ts`, both using the existing organization filter helper so results stay org-scoped. Exposed through the data context type.
- Recent-list load stays capped (20 rows, ordered newest first) instead of pulling every customer.
- UI work in `src/components/invoice/CustomerVehicleSelection.tsx`, plus a new `src/components/customer/CustomerQuickAddDialog.tsx` and a small reusable searchable-select component.
- No database, RLS, or invoice-saving changes; `organization_id` remains server-side.

