-- Update the create_organization_and_assign_user function to return specific error codes
-- for different scenarios when a user already exists

CREATE OR REPLACE FUNCTION public.create_organization_and_assign_user(
  p_user_id uuid, 
  p_organization_name text, 
  p_user_name text, 
  p_user_role text DEFAULT 'owner'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_org_id uuid;
  v_existing_org_id uuid;
  v_existing_profile RECORD;
  v_existing_org_name text;
BEGIN
  -- Check if user already has a profile (exists in any organization)
  SELECT * INTO v_existing_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_existing_profile IS NOT NULL THEN
    -- Get the organization name for the existing profile
    SELECT name INTO v_existing_org_name
    FROM public.organizations
    WHERE id::text = v_existing_profile.organization_id;
    
    -- User already exists in an organization
    RETURN json_build_object(
      'success', false,
      'error', 'user_exists_in_organization',
      'message', 'This email is already registered with another organization.',
      'existing_organization', COALESCE(v_existing_org_name, 'Unknown Organization'),
      'existing_organization_id', v_existing_profile.organization_id
    );
  END IF;
  
  -- Check if organization already exists
  SELECT id INTO v_existing_org_id
  FROM public.organizations
  WHERE LOWER(name) = LOWER(p_organization_name);
  
  IF v_existing_org_id IS NOT NULL THEN
    -- Organization exists, return error
    RETURN json_build_object(
      'success', false,
      'error', 'organization_exists',
      'message', 'Organization already exists. Please contact your administrator to be added to this organization.'
    );
  ELSE
    -- Create new organization with default country and currency
    INSERT INTO public.organizations (name, subscription_level, subscription_status, country, currency)
    VALUES (p_organization_name, 'trial', 'active', 'United States', 'USD')
    RETURNING id INTO v_org_id;
    
    -- Assign user as owner of new organization (full permissions)
    UPDATE public.profiles
    SET organization_id = v_org_id,
        role = 'owner',
        name = p_user_name
    WHERE id = p_user_id;
    
    RETURN json_build_object(
      'success', true,
      'organization_id', v_org_id,
      'role', 'owner',
      'message', 'Created new organization successfully'
    );
  END IF;
END;
$function$;