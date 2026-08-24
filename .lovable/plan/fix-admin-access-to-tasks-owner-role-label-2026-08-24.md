# Fix admin access to Tasks + owner role label

## What's wrong

**1. Admins are blocked from the Tasks page.**
`src/pages/Tasks.tsx` imports `hasPermission` from `src/services/data-service.ts`, which is a leftover mock implementation: it returns `true` only for `owner`, and for `manager` only on `tasks/manage`. Every other role — including `admin` — gets `false`, so the page short-circuits to "You don't have permission to view tasks."

The real RBAC helper (`src/utils/permissions.ts`) already grants `admin` full view/create/edit/delete on tasks, and the database RLS policies on `tasks` are organization-scoped (no role restriction), so nothing is blocking admins at the data layer. This is purely the wrong import.

Two secondary role gaps on the same page: `shouldShowVehicleColumn` and `shouldShowAssignmentColumn` (lines 327-328) list `foreman`, `manager`, `owner` but omit `admin`, so even after the view fix an admin would see a reduced table without the Vehicle/Customer column and the mechanic-assignment action.

**2. Owner is labelled "Admin" in the sidebar.**
`src/components/AppSidebar.tsx` line 219 renders `currentUser.role === 'owner' ? 'Admin' : currentUser.role`, and `src/components/Layout.tsx` line 40 does the same. This was a deliberate earlier choice, but it makes owner and admin indistinguishable in the UI.

## Changes

### Tasks page (`src/pages/Tasks.tsx`)
- Import `hasPermission` from `@/utils/permissions` instead of `@/services/data-service`.
- Derive `canManageTasks` from the permission helper (`hasPermission(currentUser, 'tasks', 'manage')`) rather than the hardcoded role list, so admin and any future role config are honoured.
- Add `admin` to the vehicle-column and assignment-column conditions (or derive them from `hasPermission(..., 'tasks', 'manage')` plus foreman).
- Leave `handleEditTask`'s mechanic-owns-their-task rule intact.

### Mock permission helper (`src/services/data-service.ts`)
- Delete the mock `hasPermission` export and re-point any remaining importers at `@/utils/permissions` so this class of bug can't recur. (Scan for other files importing `hasPermission` from `data-service` and fix them in the same pass.)

### Role label
- Show `Owner` for the owner role in `AppSidebar.tsx` and `Layout.tsx` instead of relabelling it "Admin", so the two roles are visually distinct.

## Verification
- Sign in as an admin-role user in the org and confirm the Tasks page lists tasks, shows the Vehicle/Customer column, and that Add Task / Edit / Assign-mechanic all work end to end (task actually persists).
- Confirm owner still sees everything and the sidebar now reads "Owner".
