# Vehicle Management: Edit and Safe Removal

## Current state

Confirmed by reading the customer detail page, the permissions table, the vehicle data hooks, and the database:

- **Transfer to another customer: works today.** Each vehicle card has a menu with "Transfer", restricted to Owner, Admin, and Manager. It reassigns the vehicle's customer and refreshes the list.
- **Removal: does not exist.** No delete control in the UI and no delete function in the vehicle data layer. The database policy would allow it.
- **Editing vehicle details: does not exist.** Vehicles can only be created and transferred. Make, model, year, plate, VIN, and color are fixed after creation.
- **Deleting a vehicle would destroy invoices.** The invoices-to-vehicles database link is set to cascade, so removing a vehicle would also remove every invoice for that vehicle, including its payments. Tasks are not cascading; they would block the delete instead.

## What to build

### 1. Fix the unsafe invoice link first

Change the invoices-to-vehicles relationship so a vehicle can never take invoices down with it. Deleting a vehicle that has invoices will be refused, protecting financial history and reports. This is required groundwork for the delete feature.

### 2. Edit vehicle details

Add "Edit" to the vehicle card menu on the customer detail page, opening the existing vehicle form pre-filled with current values. Editable: make, model, year, license plate, VIN, colour. The owning customer is not changed here — that stays with Transfer, so the two actions don't overlap.

Available to Owner, Admin, Manager, and Foreman (matching existing vehicle edit permission).

### 3. Remove a vehicle

Add "Remove" to the vehicle card menu, restricted to Owner, Admin, and Manager (matching existing vehicle delete permission), styled as a destructive action.

Behaviour:

- A confirmation dialog naming the vehicle and its plate, warning the action cannot be undone.
- Before deleting, check for linked invoices, estimates, and tasks. If any exist, the removal is blocked with a clear message stating how many records reference the vehicle and suggesting Transfer instead.
- Only vehicles with no history can be deleted, so nothing already billed is ever lost.
- On success, the vehicle disappears from the customer's list and a confirmation toast appears.

### 4. Reflect the same options on the Vehicles list

If the standalone vehicle list shows per-vehicle actions, give it the same Edit, Transfer, and Remove options so behaviour is consistent wherever a vehicle appears.

## Technical notes

- Migration: drop and recreate `invoices_vehicle_id_fkey` with `ON DELETE RESTRICT` instead of `CASCADE`. No data change, no new tables, so no new grants or policies are needed. Existing organization-scoped policies on `vehicles` already cover update and delete.
- Add `deleteVehicle(id)` to `useVehicles.ts` and expose it through `DataContextType.ts` / `DataContext.tsx`, following the existing optimistic-update-with-rollback pattern used by `updateVehicle` and `updateCustomer`.
- The dependency pre-check queries `invoices` and `tasks` by `vehicle_id` and counts rows before attempting the delete, so the user gets a friendly message rather than a raw database error. The database restriction remains the final backstop.
- Reuse `VehicleDialog` for editing by passing the existing vehicle as initial values; reuse the shadcn `AlertDialog` for the removal confirmation.
- Gate the menu items with `PermissionGuard resource="vehicles" action="edit"` and `action="delete"` respectively.
- `organization_id` continues to be handled by the existing database trigger and is never sent from the client.
