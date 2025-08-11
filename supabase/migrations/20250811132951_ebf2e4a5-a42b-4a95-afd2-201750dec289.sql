-- Update the organization signup function to prevent auto-joining existing organizations
CREATE OR REPLACE FUNCTION public.create_organization_and_assign_user(
  p_user_id uuid, 
  p_organization_name text, 
  p_user_name text, 
  p_user_role text DEFAULT 'admin'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    -- Create new organization
    INSERT INTO public.organizations (name, subscription_level, subscription_status)
    VALUES (p_organization_name, 'trial', 'active')
    RETURNING id INTO v_org_id;
    
    -- Assign user as admin of new organization
    UPDATE public.profiles
    SET organization_id = v_org_id,
        role = 'admin',
        name = p_user_name
    WHERE id = p_user_id;
    
    RETURN json_build_object(
      'success', true,
      'organization_id', v_org_id,
      'role', 'admin',
      'message', 'Created new organization successfully'
    );
  END IF;
END;
$$;