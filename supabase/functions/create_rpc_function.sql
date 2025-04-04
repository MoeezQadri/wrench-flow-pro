
-- Function to get all users with their profile data
-- This will be used by the superadmin dashboard
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  is_active BOOLEAN,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  organization_id UUID,
  email_confirmed BOOLEAN
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email,
    p.name,
    p.role,
    p.is_active,
    p."lastLogin" as last_login,
    au.created_at,
    p.organization_id,
    au.email_confirmed_at IS NOT NULL as email_confirmed
  FROM
    auth.users au
  LEFT JOIN
    public.profiles p ON au.id = p.id
  ORDER BY
    au.created_at DESC;
END;
$$
LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users_with_profiles() TO service_role;
