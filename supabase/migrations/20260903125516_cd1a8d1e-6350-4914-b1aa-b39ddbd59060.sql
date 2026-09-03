CREATE OR REPLACE FUNCTION public.prevent_customer_protected_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.total_visits IS DISTINCT FROM OLD.total_visits
     OR NEW.lifetime_value IS DISTINCT FROM OLD.lifetime_value
     OR NEW.last_visit IS DISTINCT FROM OLD.last_visit
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only customer contact details can be edited';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_customer_system_fields ON public.customers;

CREATE TRIGGER protect_customer_system_fields
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_customer_protected_field_changes();