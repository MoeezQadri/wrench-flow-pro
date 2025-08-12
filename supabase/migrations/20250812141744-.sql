-- Retry: create org-aware policies without IF NOT EXISTS (Postgres doesn't support it)

-- Ensure RLS enabled
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- invoices
DROP POLICY IF EXISTS "Org members can read invoices" ON public.invoices;
DROP POLICY IF EXISTS "Org members can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Org members can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Org members can delete invoices" ON public.invoices;
CREATE POLICY "Org members can read invoices"
ON public.invoices FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update invoices"
ON public.invoices FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete invoices"
ON public.invoices FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- invoice_items
DROP POLICY IF EXISTS "Org members can read invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Org members can insert invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Org members can update invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Org members can delete invoice_items" ON public.invoice_items;
CREATE POLICY "Org members can read invoice_items"
ON public.invoice_items FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert invoice_items"
ON public.invoice_items FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update invoice_items"
ON public.invoice_items FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete invoice_items"
ON public.invoice_items FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- parts
DROP POLICY IF EXISTS "Org members can read parts" ON public.parts;
DROP POLICY IF EXISTS "Org members can insert parts" ON public.parts;
DROP POLICY IF EXISTS "Org members can update parts" ON public.parts;
DROP POLICY IF EXISTS "Org members can delete parts" ON public.parts;
CREATE POLICY "Org members can read parts"
ON public.parts FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert parts"
ON public.parts FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update parts"
ON public.parts FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete parts"
ON public.parts FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- expenses
DROP POLICY IF EXISTS "Org members can read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Org members can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Org members can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Org members can delete expenses" ON public.expenses;
CREATE POLICY "Org members can read expenses"
ON public.expenses FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update expenses"
ON public.expenses FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete expenses"
ON public.expenses FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- vehicles
DROP POLICY IF EXISTS "Org members can read vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Org members can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Org members can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Org members can delete vehicles" ON public.vehicles;
CREATE POLICY "Org members can read vehicles"
ON public.vehicles FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update vehicles"
ON public.vehicles FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete vehicles"
ON public.vehicles FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- customers
DROP POLICY IF EXISTS "Org members can read customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can update customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can delete customers" ON public.customers;
CREATE POLICY "Org members can read customers"
ON public.customers FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert customers"
ON public.customers FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update customers"
ON public.customers FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete customers"
ON public.customers FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- tasks
DROP POLICY IF EXISTS "Org members can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Org members can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Org members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Org members can delete tasks" ON public.tasks;
CREATE POLICY "Org members can read tasks"
ON public.tasks FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert tasks"
ON public.tasks FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update tasks"
ON public.tasks FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete tasks"
ON public.tasks FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- payments
DROP POLICY IF EXISTS "Org members can read payments" ON public.payments;
DROP POLICY IF EXISTS "Org members can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Org members can update payments" ON public.payments;
DROP POLICY IF EXISTS "Org members can delete payments" ON public.payments;
CREATE POLICY "Org members can read payments"
ON public.payments FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert payments"
ON public.payments FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update payments"
ON public.payments FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete payments"
ON public.payments FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- attendance
DROP POLICY IF EXISTS "Org members can read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Org members can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Org members can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Org members can delete attendance" ON public.attendance;
CREATE POLICY "Org members can read attendance"
ON public.attendance FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert attendance"
ON public.attendance FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update attendance"
ON public.attendance FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete attendance"
ON public.attendance FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- vendors
DROP POLICY IF EXISTS "Org members can read vendors" ON public.vendors;
DROP POLICY IF EXISTS "Org members can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Org members can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Org members can delete vendors" ON public.vendors;
CREATE POLICY "Org members can read vendors"
ON public.vendors FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert vendors"
ON public.vendors FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update vendors"
ON public.vendors FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete vendors"
ON public.vendors FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- mechanics
DROP POLICY IF EXISTS "Org members can read mechanics" ON public.mechanics;
DROP POLICY IF EXISTS "Org members can insert mechanics" ON public.mechanics;
DROP POLICY IF EXISTS "Org members can update mechanics" ON public.mechanics;
DROP POLICY IF EXISTS "Org members can delete mechanics" ON public.mechanics;
CREATE POLICY "Org members can read mechanics"
ON public.mechanics FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert mechanics"
ON public.mechanics FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update mechanics"
ON public.mechanics FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete mechanics"
ON public.mechanics FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- payables
DROP POLICY IF EXISTS "Org members can read payables" ON public.payables;
DROP POLICY IF EXISTS "Org members can insert payables" ON public.payables;
DROP POLICY IF EXISTS "Org members can update payables" ON public.payables;
DROP POLICY IF EXISTS "Org members can delete payables" ON public.payables;
CREATE POLICY "Org members can read payables"
ON public.payables FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can insert payables"
ON public.payables FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can update payables"
ON public.payables FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());
CREATE POLICY "Org members can delete payables"
ON public.payables FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- organizations policies
DROP POLICY IF EXISTS "Superadmins manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can read their organization" ON public.organizations;
CREATE POLICY "Superadmins manage organizations"
ON public.organizations FOR ALL
USING (public.user_is_superadmin())
WITH CHECK (public.user_is_superadmin());
CREATE POLICY "Users can read their organization"
ON public.organizations FOR SELECT
USING (public.user_is_superadmin() OR id::text = public.current_user_org());