# Vendors get their own screen, and bills show the parts they cover

## What changes for you

**A real Vendors screen**

- "Vendors" becomes its own item in the left menu, next to Payable Management.
- It is available to owners, admins and the finance role only, and only while the subscription or trial is active — same rule as Payable Management.
- The screen keeps everything the current pop-up does: search, add, edit, delete a vendor, the amount owed to each vendor, the list of that vendor's bills, and both ways to pay (one bill at a time, or one payment split across bills oldest first).
- The Parts page loses the "Vendor Management" pop-up. The button there becomes a link that takes you to the Vendors screen, so nothing gets lost.

**Bills show which parts they cover**

- When parts are bought — from the Parts page or as a custom part on an invoice — the bill records the part it was raised for.
- Each bill in the Vendors screen and in Payable Management shows the part name, quantity and unit cost it covers, instead of only a text description.
- Once a bill is fully paid, those parts are shown as "paid for" wherever the bill is listed.
- Money totals are not being changed: expenses, amounts owed, part cost of goods sold and profit keep working exactly as they do today. This is about being able to see what a payment was for.

## Technical detail

**Vendors screen**

- New page `src/pages/Vendors.tsx` rendering the existing `VendorList` plus the add/edit dialog (logic lifted out of `VendorManagement.tsx`, which is then removed).
- Route `vendors` in `src/App.tsx` inside the same protected/subscription layout as `finance`, wrapped in `PagePermissionGuard resource="vendors" action="view"`.
- `src/utils/permissions.ts`: add a `vendors` resource with `view/create/edit` for `owner, admin, finance` and `delete` for `owner, admin`.
- `src/components/AppSidebar.tsx`: add a Vendors entry guarded by the same permission, grouped with Payable Management.
- `src/pages/Parts.tsx`: drop `showVendorManagement` state and the dialog; the button navigates to `/vendors`.

**Part linkage on bills**

- Migration: add nullable `part_id uuid references public.parts(id) on delete set null`, plus `quantity numeric` and `unit_cost numeric`, to `public.expenses`; add nullable `part_id` to `public.payables`. No changes to grants or policies beyond what the tables already have.
- `src/components/part/PartDialog.tsx`: include `part_id`, quantity and unit cost on the purchase expense it creates.
- `src/services/optimized-invoice-service.ts`: the custom-part purchase expense records the newly created part the same way.
- Trigger/handler that turns an expense into a payable (`handle_expense_payable`) carries `part_id` across to the payable so the bill knows its part.
- `VendorBillsSection.tsx`, `PayVendorDialog.tsx` and `PayableDialog.tsx` render the linked part (name, quantity, unit cost) and a "Parts paid for" marker when outstanding is zero.
- Reporting and calculation files (`invoice-calculations.ts`, `FinanceReport.tsx`, `FinancialReport.tsx`, dashboards) are left untouched.

## Testing

- Vendors screen reachable from the menu; blocked for a technician/manager account and while a trial is expired.
- Add, edit, delete vendor still work; delete still refuses when the vendor is in use.
- Buy a part with a vendor, confirm the bill lists that part, pay it partly then fully, and confirm the part shows as paid for.
- Confirm expense totals, amounts owed, cost of goods sold and profit figures are unchanged before and after the change.
- Parts page button lands on the Vendors screen.
