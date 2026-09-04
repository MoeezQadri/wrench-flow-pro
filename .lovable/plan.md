# Remove pre-save navigation from the invoice form

## Problem
When creating an invoice with **zero customers**, `InvoiceForm.tsx` shows a blue "Add Your First Customer" banner whose button is a `<Link to="/customers/new">` — the only action during invoice creation that navigates away from the form and discards unsaved lines. The `CustomerVehicleSelection` component rendered directly below that banner already has an inline **Add Customer** button that opens `CustomerQuickAddDialog`, stays on the page, and auto-selects the new customer. The banner is therefore redundant *and* the sole source of accidental data loss mid-creation.

## Change
Replace the navigation banner with an inline trigger that opens the same `CustomerQuickAddDialog`, so creating a customer never leaves the invoice form.

### File: `src/components/InvoiceForm.tsx`
1. Add state: `const [bannerCustomerDialogOpen, setBannerCustomerDialogOpen] = useState(false);`
2. Add a handler that reuses the existing `addCustomer` from `useDataContext`:
   ```tsx
   const handleBannerCustomerSave = async (customer: Partial<Customer>) => {
     const created = await addCustomer(customer as Customer);
     if (created) {
       setSelectedCustomerId(created.id);
       setSelectedVehicleId("");
       toast.success("Customer added and selected");
     }
   };
   ```
3. Replace the banner block (lines ~759–776): swap the `<Link to="/customers/new">Add Customer</Link>` button for a normal `<Button type="button" onClick={() => setBannerCustomerDialogOpen(true)}>Add Customer</Button>`.
4. Render `<CustomerQuickAddDialog open={bannerCustomerDialogOpen} onOpenChange={setBannerCustomerDialogOpen} onSave={handleBannerCustomerSave} />` near the bottom of the component (next to the existing dialogs).
5. Ensure `addCustomer` is destructured from `useDataContext` (add if missing) and `CustomerQuickAddDialog` is imported (add if missing).

### Verification
- `tsgo --noEmit` clean.
- Browser check on `/invoices/new` with an org that has no customers: banner button opens the dialog, saving a customer selects it inline, URL stays `/invoices/new`.
- Existing inline "Add Customer" button in the Customer field still works unchanged.

## Out of scope
- No beforeunload/unsaved-changes warning (user declined).
- No change to post-save navigation (stays going to `/invoices`).
