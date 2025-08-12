DO $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Find or create the target organization named 'test'
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE lower(name) = lower('test')
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, subscription_level, subscription_status)
    VALUES ('test', 'trial', 'active')
    RETURNING id INTO v_org_id;
  END IF;

  -- Backfill organization_id for all tenant tables where it's NULL or empty
  UPDATE public.invoices SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.invoice_items SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.parts SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.expenses SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.vehicles SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.customers SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.tasks SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.payments SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.attendance SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.vendors SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.mechanics SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
  UPDATE public.payables SET organization_id = v_org_id::text WHERE organization_id IS NULL OR organization_id = '';
END $$;