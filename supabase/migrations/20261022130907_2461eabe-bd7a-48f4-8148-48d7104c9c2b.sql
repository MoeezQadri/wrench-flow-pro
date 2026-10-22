CREATE OR REPLACE FUNCTION public.guard_work_order_to_invoice()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status IN ('approved','work_in_progress','work_completed')
     AND NEW.status IN ('payment_pending','partial_payment','payment_completed')
     AND COALESCE(current_setting('app.move_to_invoice', true), '') <> 'on' THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER b_guard_work_order_to_invoice BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.guard_work_order_to_invoice();

CREATE OR REPLACE FUNCTION public.move_work_order_to_invoice(p_invoice_id uuid, p_status text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_org text; v_status text;
BEGIN
  IF p_status NOT IN ('payment_pending','partial_payment','payment_completed') THEN
    RAISE EXCEPTION 'Invalid invoice stage';
  END IF;
  SELECT organization_id, status INTO v_org, v_status FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF v_org IS DISTINCT FROM public.current_user_org() AND NOT public.user_is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized for this invoice';
  END IF;
  IF v_status NOT IN ('approved','work_in_progress','work_completed') THEN
    RAISE EXCEPTION 'Only work orders can be moved to an invoice';
  END IF;
  PERFORM set_config('app.move_to_invoice', 'on', true);
  UPDATE invoices SET status = p_status, updated_at = now() WHERE id = p_invoice_id;
  PERFORM set_config('app.move_to_invoice', '', true);
  RETURN p_status;
END $$;

REVOKE ALL ON FUNCTION public.move_work_order_to_invoice(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.move_work_order_to_invoice(uuid, text) TO authenticated;