CREATE OR REPLACE FUNCTION public.invoice_delete_preview(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_org text;
  v_parts jsonb := '[]'::jsonb;
  v_tasks integer := 0;
  v_expenses integer := 0;
  v_payments integer := 0;
BEGIN
  v_org := public.current_user_org();

  SELECT id, status, organization_id INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT public.user_is_superadmin() AND v_invoice.organization_id IS DISTINCT FROM v_org THEN
    RAISE EXCEPTION 'Not authorized for this invoice';
  END IF;

  SELECT count(*) INTO v_payments FROM public.payments WHERE invoice_id = p_invoice_id;
  SELECT count(*) INTO v_tasks FROM public.tasks WHERE invoice_id = p_invoice_id;
  SELECT count(*) INTO v_expenses FROM public.expenses WHERE invoice_id = p_invoice_id;

  IF v_invoice.status NOT IN ('estimate', 'declined') THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'part_id', t.part_id,
             'name', COALESCE(p.name, 'Part'),
             'quantity', t.qty
           ) ORDER BY COALESCE(p.name, 'Part')), '[]'::jsonb)
    INTO v_parts
    FROM (
      SELECT ii.part_id, SUM(ii.quantity)::numeric AS qty
      FROM public.invoice_items ii
      WHERE ii.invoice_id = p_invoice_id
        AND ii.type = 'part'
        AND ii.part_id IS NOT NULL
      GROUP BY ii.part_id
    ) t
    LEFT JOIN public.parts p ON p.id = t.part_id;
  END IF;

  RETURN jsonb_build_object(
    'status', v_invoice.status,
    'payment_count', v_payments,
    'task_count', v_tasks,
    'expense_count', v_expenses,
    'parts_restored', v_parts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invoice_delete_preview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invoice_delete_preview(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.delete_invoice_cascade(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_org text;
  v_role text;
  v_payments integer := 0;
  v_tasks integer := 0;
  v_expenses integer := 0;
  v_restored integer := 0;
  r RECORD;
BEGIN
  v_org := public.current_user_org();

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();

  SELECT id, status, organization_id INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT public.user_is_superadmin() THEN
    IF v_invoice.organization_id IS DISTINCT FROM v_org THEN
      RAISE EXCEPTION 'Not authorized for this invoice';
    END IF;
    IF v_role IS NULL OR v_role NOT IN ('owner', 'admin') THEN
      RAISE EXCEPTION 'Only owners and admins can delete invoices';
    END IF;
  END IF;

  SELECT count(*) INTO v_payments FROM public.payments WHERE invoice_id = p_invoice_id;
  IF v_payments > 0 THEN
    RAISE EXCEPTION 'This invoice has payments recorded. Remove the payments first, then delete the invoice.';
  END IF;

  -- Estimates and declined estimates never consumed stock, so nothing to give back.
  IF v_invoice.status NOT IN ('estimate', 'declined') THEN
    FOR r IN
      SELECT ii.part_id, SUM(ii.quantity)::numeric AS qty
      FROM public.invoice_items ii
      WHERE ii.invoice_id = p_invoice_id
        AND ii.type = 'part'
        AND ii.part_id IS NOT NULL
      GROUP BY ii.part_id
    LOOP
      UPDATE public.parts
      SET quantity = GREATEST(0, COALESCE(quantity, 0) + r.qty)::integer,
          invoice_ids = COALESCE(
            (SELECT array_agg(x) FROM unnest(COALESCE(invoice_ids, ARRAY[]::text[])) AS x
             WHERE x <> p_invoice_id::text),
            ARRAY[]::text[]
          ),
          updated_at = now()
      WHERE id = r.part_id;

      v_restored := v_restored + 1;
    END LOOP;
  END IF;

  -- Jobs survive the invoice; they just lose the link and can be billed again.
  UPDATE public.tasks
  SET invoice_id = NULL, updated_at = now()
  WHERE invoice_id = p_invoice_id;
  GET DIAGNOSTICS v_tasks = ROW_COUNT;

  -- Purchase bills this invoice created have no source document any more.
  DELETE FROM public.payables WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE invoice_id = p_invoice_id
  );

  DELETE FROM public.expenses WHERE invoice_id = p_invoice_id;
  GET DIAGNOSTICS v_expenses = ROW_COUNT;

  DELETE FROM public.invoice_items WHERE invoice_id = p_invoice_id;
  DELETE FROM public.invoices WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'parts_restored', v_restored,
    'tasks_released', v_tasks,
    'expenses_removed', v_expenses
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_invoice_cascade(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_invoice_cascade(uuid) TO authenticated, service_role;