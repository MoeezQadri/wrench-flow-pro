-- Remove the vulnerable user_profiles view that exposes auth.users
DROP VIEW IF EXISTS public.user_profiles;

-- Create a secure function instead that only returns data for authorized users
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  organization_id TEXT,
  role TEXT,
  is_active BOOLEAN,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to get their own profile, or superadmins to get any profile
  IF user_id != auth.uid() AND NOT user_is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Cannot access other users profiles';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    CASE 
      WHEN user_id = auth.uid() OR user_is_superadmin() THEN au.email::TEXT
      ELSE NULL
    END as email,
    p.name,
    p.organization_id,
    p.role,
    p.is_active,
    p."lastLogin" as last_login,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.id = user_id;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_profile(UUID) FROM anon;