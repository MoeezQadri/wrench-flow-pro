# Fix "Add Vehicle" in the customer and vehicle areas

## What's wrong today

Verified in the code:

1. **Vehicles page** (`/vehicles`) — the "Add New Vehicle" button shows for anyone with `vehicles:create` **or** `vehicles:manage`, but the dialog it opens (`VehicleDialog`) returns `null` unless the user has `vehicles:manage`. For a foreman (create/edit only) the button visibly does nothing. There is also no feedback when the dialog is suppressed.
2. **Customer detail page** (`/customers/:id`, `CustomerDetails.tsx`) — the vehicles card lists vehicles and offers "Transfer", but there is **no** Add Vehicle button at all, and the empty state ("No vehicles registered") has no way to add one.
3. **`CustomerDetail.tsx`** — an older, unrouted duplicate page that does contain an "Add Vehicle" button with **no click handler** (a genuine dead button). Nothing renders it today.

## What will change

- **Vehicles page**: align the gate so the button and the dialog use the same permission (`vehicles:manage` OR `vehicles:create`), so the button always opens a working dialog for anyone allowed to add vehicles.
- **Customer detail page**: add an "Add Vehicle" button in the vehicles card header and in the empty state, both gated by the same vehicle permission. Clicking opens the existing Add Vehicle dialog with the customer pre-selected; on save the vehicle is inserted and the customer's vehicle list refreshes immediately.
- **Dead duplicate**: remove the unrouted `CustomerDetail.tsx` page so the no-op button can't resurface (no route or import points to it).

## Technical notes

- `VehicleDialog`: change its internal guard from `hasPermission(user,'vehicles','manage')` to `manage || create`; keep returning `null` only when the user truly can't add vehicles.
- `Vehicles.tsx`: single `canAddVehicle` constant used for both the button and the dialog.
- `CustomerDetails.tsx`: add `vehicleDialogOpen` state, render `<VehicleDialog customerId={id} onSave={...} />`, persist via the existing `addVehicle` from `useDataContext()` (org id is set by the DB trigger), then re-run `getVehiclesByCustomerId(id)` to refresh, wrapped in `PermissionGuard resource="vehicles" action="create"`.
- No database or RLS changes needed; `vehicles` inserts already work from the invoice flow.
