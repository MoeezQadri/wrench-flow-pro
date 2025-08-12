-- 1) Helper functions for organization and role
-- Safely get current user's organization id from profiles
CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user is superadmin/superuser
CREATE OR REPLACE FUNCTION public.user_is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('superuser','superadmin')
  );
$$;

-- 2) Generic trigger function to auto-fill organization_id
CREATE OR REPLACE FUNCTION public.set_row_org_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_user_org();
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Add organization_id to tenant tables and attach trigger
-- Helper macro via comments for readability
-- Tenanted tables: invoices, invoice_items, parts, expenses, vehicles, customers, tasks, payments, attendance, vendors, mechanics, payables

-- invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.invoices;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- invoice_items
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_invoice_items_org_id ON public.invoice_items(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.invoice_items;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- parts
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_parts_org_id ON public.parts(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.parts;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.parts
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON public.expenses(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.expenses;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON public.vehicles(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.vehicles;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.customers;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON public.tasks(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.tasks;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON public.payments(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.payments;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_attendance_org_id ON public.attendance(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.attendance;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_vendors_org_id ON public.vendors(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.vendors;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- mechanics
ALTER TABLE public.mechanics ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_mechanics_org_id ON public.mechanics(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.mechanics;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.mechanics
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- payables
ALTER TABLE public.payables ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_payables_org_id ON public.payables(organization_id);
DROP TRIGGER IF EXISTS set_org_id_before_insert ON public.payables;
CREATE TRIGGER set_org_id_before_insert
BEFORE INSERT ON public.payables
FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

-- 4) Enable RLS and replace permissive policies with org-aware ones
-- Helper to enable RLS on all tenanted tables
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

-- Drop existing overly-permissive policies if present
DROP POLICY IF EXISTS "Allow authenticated users full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated users full access to invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow authenticated users full access to parts" ON public.parts;
DROP POLICY IF EXISTS "Allow authenticated users full access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users full access to vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow authenticated users full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users full access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users full access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated users full access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated users full access to mechanics" ON public.mechanics;
DROP POLICY IF EXISTS "Allow authenticated users full access to payables" ON public.payables;

-- Create org-aware policies for each table
-- Template applied to all tenanted tables

-- invoices
CREATE POLICY IF NOT EXISTS "Org members can read invoices"
ON public.invoices FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update invoices"
ON public.invoices FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete invoices"
ON public.invoices FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- invoice_items
CREATE POLICY IF NOT EXISTS "Org members can read invoice_items"
ON public.invoice_items FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert invoice_items"
ON public.invoice_items FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update invoice_items"
ON public.invoice_items FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete invoice_items"
ON public.invoice_items FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- parts
CREATE POLICY IF NOT EXISTS "Org members can read parts"
ON public.parts FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert parts"
ON public.parts FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update parts"
ON public.parts FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete parts"
ON public.parts FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- expenses
CREATE POLICY IF NOT EXISTS "Org members can read expenses"
ON public.expenses FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update expenses"
ON public.expenses FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete expenses"
ON public.expenses FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- vehicles
CREATE POLICY IF NOT EXISTS "Org members can read vehicles"
ON public.vehicles FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update vehicles"
ON public.vehicles FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete vehicles"
ON public.vehicles FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- customers
CREATE POLICY IF NOT EXISTS "Org members can read customers"
ON public.customers FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert customers"
ON public.customers FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update customers"
ON public.customers FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete customers"
ON public.customers FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- tasks
CREATE POLICY IF NOT EXISTS "Org members can read tasks"
ON public.tasks FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert tasks"
ON public.tasks FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update tasks"
ON public.tasks FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete tasks"
ON public.tasks FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- payments
CREATE POLICY IF NOT EXISTS "Org members can read payments"
ON public.payments FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert payments"
ON public.payments FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update payments"
ON public.payments FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete payments"
ON public.payments FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- attendance
CREATE POLICY IF NOT EXISTS "Org members can read attendance"
ON public.attendance FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert attendance"
ON public.attendance FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update attendance"
ON public.attendance FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete attendance"
ON public.attendance FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- vendors
CREATE POLICY IF NOT EXISTS "Org members can read vendors"
ON public.vendors FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert vendors"
ON public.vendors FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update vendors"
ON public.vendors FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete vendors"
ON public.vendors FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- mechanics
CREATE POLICY IF NOT EXISTS "Org members can read mechanics"
ON public.mechanics FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert mechanics"
ON public.mechanics FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update mechanics"
ON public.mechanics FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete mechanics"
ON public.mechanics FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- payables
CREATE POLICY IF NOT EXISTS "Org members can read payables"
ON public.payables FOR SELECT
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can insert payables"
ON public.payables FOR INSERT
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can update payables"
ON public.payables FOR UPDATE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org())
WITH CHECK (public.user_is_superadmin() OR organization_id = public.current_user_org());

CREATE POLICY IF NOT EXISTS "Org members can delete payables"
ON public.payables FOR DELETE
USING (public.user_is_superadmin() OR organization_id = public.current_user_org());

-- 5) Fix organizations table policies: restrict non-superadmins to only their org
-- Drop previous policies if they exist
DROP POLICY IF EXISTS "Allow superusers to manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Allow users to read organizations" ON public.organizations;

-- Superadmins manage all
CREATE POLICY IF NOT EXISTS "Superadmins manage organizations"
ON public.organizations FOR ALL
USING (public.user_is_superadmin())
WITH CHECK (public.user_is_superadmin());

-- Others can only read their own org
CREATE POLICY IF NOT EXISTS "Users can read their organization"
ON public.organizations FOR SELECT
USING (public.user_is_superadmin() OR id::text = public.current_user_org());
