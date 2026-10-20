ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

CREATE OR REPLACE FUNCTION public.convert_legacy_invoice_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.status := CASE NEW.status
    WHEN 'open' THEN 'approved'
    WHEN 'in-progress' THEN 'work_in_progress'
    WHEN 'completed' THEN 'payment_pending'
    WHEN 'partial' THEN 'partial_payment'
    WHEN 'paid' THEN 'payment_completed'
    ELSE NEW.status END;
  RETURN NEW;
END $$;

CREATE TRIGGER a_invoice_status_compat
BEFORE INSERT OR UPDATE OF status ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.convert_legacy_invoice_status();

UPDATE public.invoices SET status = CASE status
  WHEN 'open' THEN 'approved'
  WHEN 'in-progress' THEN 'work_in_progress'
  WHEN 'completed' THEN 'payment_pending'
  WHEN 'partial' THEN 'partial_payment'
  WHEN 'paid' THEN 'payment_completed'
  ELSE status END
WHERE status IN ('open','in-progress','completed','partial','paid');

ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check CHECK (status = ANY (ARRAY[
  'estimate','declined','approved','work_in_progress','payment_pending','partial_payment','payment_completed',
  'open','in-progress','completed','partial','paid']));

CREATE OR REPLACE FUNCTION public.set_invoice_completed_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('payment_pending','partial_payment','payment_completed') THEN
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := COALESCE(NEW.date, now());
      IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('payment_pending','partial_payment','payment_completed') THEN
        NEW.completed_at := now();
      END IF;
    END IF;
  ELSE
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.delete_invoice_cascade(p_invoice_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice RECORD; v_org text; v_role text;
  v_payments integer := 0; v_tasks integer := 0; v_expenses integer := 0; v_restored integer := 0;
  r RECORD;
BEGIN
  v_org := public.current_user_org();
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  SELECT id, status, organization_id INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF v_invoice IS NULL THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF NOT public.user_is_superadmin() THEN
    IF v_invoice.organization_id IS DISTINCT FROM v_org THEN RAISE EXCEPTION 'Not authorized for this invoice'; END IF;
    IF v_role IS NULL OR v_role NOT IN ('owner', 'admin') THEN RAISE EXCEPTION 'Only owners and admins can delete invoices'; END IF;
  END IF;
  IF v_invoice.status IN ('payment_pending','partial_payment','payment_completed') THEN
    RAISE EXCEPTION 'Completed work can''t be deleted. Reopen it to a work order first.';
  END IF;
  SELECT count(*) INTO v_payments FROM public.payments WHERE invoice_id = p_invoice_id;
  IF v_payments > 0 THEN
    RAISE EXCEPTION 'This invoice has payments recorded. Remove the payments first, then delete the invoice.';
  END IF;
  IF v_invoice.status NOT IN ('estimate', 'declined') THEN
    FOR r IN
      SELECT ii.part_id, SUM(ii.quantity)::numeric AS qty FROM public.invoice_items ii
      WHERE ii.invoice_id = p_invoice_id AND ii.type = 'part' AND ii.part_id IS NOT NULL GROUP BY ii.part_id
    LOOP
      UPDATE public.parts
      SET quantity = GREATEST(0, COALESCE(quantity, 0) + r.qty)::integer,
          invoice_ids = COALESCE((SELECT array_agg(x) FROM unnest(COALESCE(invoice_ids, ARRAY[]::text[])) AS x WHERE x <> p_invoice_id::text), ARRAY[]::text[]),
          updated_at = now()
      WHERE id = r.part_id;
      v_restored := v_restored + 1;
    END LOOP;
  END IF;
  UPDATE public.tasks SET invoice_id = NULL, updated_at = now() WHERE invoice_id = p_invoice_id;
  GET DIAGNOSTICS v_tasks = ROW_COUNT;
  DELETE FROM public.payables WHERE expense_id IN (SELECT id FROM public.expenses WHERE invoice_id = p_invoice_id);
  DELETE FROM public.expenses WHERE invoice_id = p_invoice_id;
  GET DIAGNOSTICS v_expenses = ROW_COUNT;
  DELETE FROM public.invoice_items WHERE invoice_id = p_invoice_id;
  DELETE FROM public.invoices WHERE id = p_invoice_id;
  RETURN jsonb_build_object('parts_restored', v_restored, 'tasks_released', v_tasks, 'expenses_removed', v_expenses);
END;
$function$;