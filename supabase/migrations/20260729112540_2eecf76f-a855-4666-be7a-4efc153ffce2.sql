CREATE TABLE public.automation_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id text NOT NULL,
  requested_by uuid NOT NULL,
  requester_name text,
  requester_email text,
  phone text,
  preferred_contact_time text,
  automations text[] NOT NULL DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.automation_requests TO authenticated;
GRANT ALL ON public.automation_requests TO service_role;

ALTER TABLE public.automation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view their org requests"
  ON public.automation_requests FOR SELECT
  TO authenticated
  USING (
    public.is_current_user_superadmin()
    OR (organization_id = public.current_user_org_secure() AND public.is_organization_admin())
  );

CREATE POLICY "Org admins can create requests for their org"
  ON public.automation_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_user_org_secure()
    AND public.is_organization_admin()
    AND requested_by = auth.uid()
  );

CREATE POLICY "Superadmins can update requests"
  ON public.automation_requests FOR UPDATE
  TO authenticated
  USING (public.is_current_user_superadmin())
  WITH CHECK (public.is_current_user_superadmin());

CREATE TRIGGER set_automation_requests_org_id
  BEFORE INSERT ON public.automation_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();

CREATE OR REPLACE FUNCTION public.update_automation_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_automation_requests_updated_at
  BEFORE UPDATE ON public.automation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_automation_requests_updated_at();