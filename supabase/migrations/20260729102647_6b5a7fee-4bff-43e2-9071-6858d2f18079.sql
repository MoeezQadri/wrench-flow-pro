
-- Trigger-based protection to prevent privilege escalation via profile updates
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Superadmins can change anything
  IF public.is_current_user_superadmin() THEN
    RETURN NEW;
  END IF;

  -- Non-superadmin: organization_id must not change
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'Not authorized to change organization_id';
  END IF;

  -- Non-superadmin & non-org-admin: role must not change
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_organization_admin() THEN
      RAISE EXCEPTION 'Not authorized to change role';
    END IF;
    -- Even org admins cannot elevate to superuser/superadmin/owner
    IF NEW.role IN ('superuser', 'superadmin', 'owner') THEN
      RAISE EXCEPTION 'Not authorized to assign privileged role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();
