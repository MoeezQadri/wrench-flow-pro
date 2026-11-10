CREATE TABLE public.owner_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text,
  date timestamptz NOT NULL DEFAULT now(),
  amount numeric NOT NULL,
  owner_name text NOT NULL,
  payment_method text,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_drawings TO authenticated;
GRANT ALL ON public.owner_drawings TO service_role;
ALTER TABLE public.owner_drawings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org admins read drawings" ON public.owner_drawings FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.is_organization_admin());
CREATE POLICY "Org admins add drawings" ON public.owner_drawings FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_org() AND public.is_organization_admin());
CREATE POLICY "Org admins edit drawings" ON public.owner_drawings FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_org() AND public.is_organization_admin())
  WITH CHECK (organization_id = public.current_user_org() AND public.is_organization_admin());
CREATE POLICY "Org admins delete drawings" ON public.owner_drawings FOR DELETE TO authenticated
  USING (organization_id = public.current_user_org() AND public.is_organization_admin());
CREATE TRIGGER set_org_id_before_insert BEFORE INSERT ON public.owner_drawings
  FOR EACH ROW EXECUTE FUNCTION public.set_row_org_id();
CREATE OR REPLACE FUNCTION public.touch_owner_drawings() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TRIGGER touch_owner_drawings BEFORE UPDATE ON public.owner_drawings
  FOR EACH ROW EXECUTE FUNCTION public.touch_owner_drawings();