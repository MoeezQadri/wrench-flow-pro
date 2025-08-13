-- Update the handle_new_user_signup function to handle invitations
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Check if this user was invited and has metadata
  IF new.raw_user_meta_data IS NOT NULL THEN
    -- Insert profile with invitation data
    INSERT INTO public.profiles (id, name, role, organization_id)
    VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'name', ''),
      COALESCE(new.raw_user_meta_data->>'role', 'member'),
      COALESCE(new.raw_user_meta_data->>'organization_id', '00000000-0000-0000-0000-000000000001')
    );
  ELSE
    -- Default signup without invitation
    INSERT INTO public.profiles (id, name, role, organization_id)
    VALUES (
      new.id, 
      '',
      'member',
      '00000000-0000-0000-0000-000000000001'
    );
  END IF;
  
  RETURN new;
END;
$function$;