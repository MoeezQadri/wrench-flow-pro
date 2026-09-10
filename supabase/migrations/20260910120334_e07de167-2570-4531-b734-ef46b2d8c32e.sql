-- 1. Helper functions: run as definer so they don't re-enter profiles RLS.
CREATE OR REPLACE FUNCTION public.current_user_org()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.user_is_superadmin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('superuser','superadmin')
  );
$function$;

-- 2. Wrap helper calls in policies in a scalar subselect so Postgres evaluates
--    them once per statement (InitPlan) instead of once per row.
--    Logic is preserved verbatim: only `f()` -> `(SELECT f())`.
DO $do$
DECLARE
  r record;
  new_qual text;
  new_check text;
  fn text;
  fns text[] := ARRAY[
    'public.current_user_org_secure()',
    'public.current_user_org()',
    'public.user_is_superadmin()',
    'public.is_organization_admin()',
    'public.is_current_user_superadmin()',
    'public.get_current_user_organization()',
    'public.is_super_admin()'
  ];
  stmt text;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename,
           p.polname AS policyname,
           pg_get_expr(p.polqual, p.polrelid) AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;

    FOREACH fn IN ARRAY fns LOOP
      IF new_qual IS NOT NULL THEN
        new_qual := replace(new_qual, fn, '(SELECT ' || fn || ')');
        -- unqualified form as rendered by pg_get_expr when search_path resolves
        new_qual := replace(new_qual, replace(fn, 'public.', ''), '(SELECT ' || fn || ')');
        -- undo accidental double wrapping from the two passes above
        new_qual := replace(new_qual, '(SELECT (SELECT ' || fn || '))', '(SELECT ' || fn || ')');
        new_qual := replace(new_qual, '(SELECT public.(SELECT ' || fn || '))', '(SELECT ' || fn || ')');
      END IF;
      IF new_check IS NOT NULL THEN
        new_check := replace(new_check, fn, '(SELECT ' || fn || ')');
        new_check := replace(new_check, replace(fn, 'public.', ''), '(SELECT ' || fn || ')');
        new_check := replace(new_check, '(SELECT (SELECT ' || fn || '))', '(SELECT ' || fn || ')');
        new_check := replace(new_check, '(SELECT public.(SELECT ' || fn || '))', '(SELECT ' || fn || ')');
      END IF;
    END LOOP;

    IF new_qual IS DISTINCT FROM r.qual OR new_check IS DISTINCT FROM r.with_check THEN
      stmt := format('ALTER POLICY %I ON public.%I', r.policyname, r.tablename);
      IF new_qual IS NOT NULL THEN
        stmt := stmt || format(' USING (%s)', new_qual);
      END IF;
      IF new_check IS NOT NULL THEN
        stmt := stmt || format(' WITH CHECK (%s)', new_check);
      END IF;
      EXECUTE stmt;
    END IF;
  END LOOP;
END
$do$;

-- 3. Missing relationship indexes.
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON public.vehicles (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_part_id ON public.invoice_items (part_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_id ON public.invoices (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices (date);
CREATE INDEX IF NOT EXISTS idx_expenses_part_id ON public.expenses (part_id);
CREATE INDEX IF NOT EXISTS idx_payables_expense_id ON public.payables (expense_id);
CREATE INDEX IF NOT EXISTS idx_payables_vendor_id ON public.payables (vendor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_invoice_id ON public.tasks (invoice_id);
CREATE INDEX IF NOT EXISTS idx_tasks_mechanic_id ON public.tasks (mechanic_id);
CREATE INDEX IF NOT EXISTS idx_attendance_mechanic_id ON public.attendance (mechanic_id);
