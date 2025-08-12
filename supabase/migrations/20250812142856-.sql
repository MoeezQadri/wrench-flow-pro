DO $$
DECLARE
  v_default_org_id text := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Clean up the test organization if it was created
  DELETE FROM public.organizations WHERE lower(name) = lower('test');
  
  -- Backfill organization_id for all tenant tables to use the Default Organization
  -- where users are actually assigned
  UPDATE public.invoices SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.invoice_items SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.parts SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.expenses SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.vehicles SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.customers SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.tasks SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.payments SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.attendance SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.vendors SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.mechanics SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
  UPDATE public.payables SET organization_id = v_default_org_id WHERE organization_id IS NULL OR organization_id = '' OR organization_id != v_default_org_id;
END $$;