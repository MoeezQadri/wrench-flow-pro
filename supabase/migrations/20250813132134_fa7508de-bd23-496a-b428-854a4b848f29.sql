-- Update the create_organization_and_assign_user function to set default country and currency
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
BEGIN
  -- Check if organization already exists
  SELECT id INTO v_existing_org_id
  FROM public.organizations
  WHERE LOWER(name) = LOWER(p_organization_name);
  
  IF v_existing_org_id IS NOT NULL THEN
    -- Organization exists, return error - user cannot auto-join
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