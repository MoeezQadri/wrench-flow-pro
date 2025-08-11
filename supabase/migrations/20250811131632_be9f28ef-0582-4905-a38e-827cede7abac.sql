-- Fix security issues from the migration

-- Fix the search_path for the functions we just created
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, role, organization_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'name',
    COALESCE(new.raw_user_meta_data->>'role', 'member'),
    COALESCE(new.raw_user_meta_data->>'organization_id', '00000000-0000-0000-0000-000000000001')
  );
  RETURN new;
END;
$function$;

-- Fix search_path for organization function
CREATE OR REPLACE FUNCTION public.create_organization_and_assign_user(
  p_user_id uuid,
  p_organization_name text,
  p_user_name text,
  p_user_role text DEFAULT 'admin'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
    -- Organization exists, assign user as member
    UPDATE public.profiles
    SET organization_id = v_existing_org_id,
        role = 'member',
        name = p_user_name
    WHERE id = p_user_id;
    
    RETURN json_build_object(
      'success', true,
      'organization_id', v_existing_org_id,
      'role', 'member',
      'message', 'Added to existing organization'
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
      'message', 'Created new organization'
    );
  END IF;
END;
$function$;