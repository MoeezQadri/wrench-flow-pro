CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_lower_unique
  ON public.organizations (lower(name));

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_org_id text;
  v_role text;
  v_name text;
BEGIN
  v_org_id := COALESCE(NULLIF(new.raw_user_meta_data->>'organization_id', ''), '');
  v_role := COALESCE(NULLIF(new.raw_user_meta_data->>'role', ''), 'member');
  v_name := COALESCE(new.raw_user_meta_data->>'name', '');

  INSERT INTO public.profiles (id, name, role, organization_id)
  VALUES (new.id, v_name, v_role, v_org_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$function$;