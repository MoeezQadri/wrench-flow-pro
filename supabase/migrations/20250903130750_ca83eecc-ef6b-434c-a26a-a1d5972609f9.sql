-- Create helper function to check if user is organization admin
CREATE OR REPLACE FUNCTION public.is_organization_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

-- Create helper function to get current user's organization
CREATE OR REPLACE FUNCTION public.get_current_user_organization()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Add new RLS policy for organization admins to view org users
CREATE POLICY "Organization admins can view org users"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR 
  (is_organization_admin() AND organization_id = get_current_user_organization())
);

-- Add new RLS policy for organization admins to update org users  
CREATE POLICY "Organization admins can update org users"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR 
  (is_organization_admin() AND organization_id = get_current_user_organization())
);

-- Create function to get users with emails for organization management
CREATE OR REPLACE FUNCTION public.get_organization_users_with_emails(org_id text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean,
  organization_id text,
  "lastLogin" timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow organization admins or users getting their own org
  IF NOT is_organization_admin() THEN
    RAISE EXCEPTION 'Access denied: Only organization admins can view organization users';
  END IF;
  
  -- Use provided org_id or current user's organization
  IF org_id IS NULL THEN
    org_id := get_current_user_organization();
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    au.email::text,
    p.role,
    p.is_active,
    p.organization_id,
    p."lastLogin",
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.organization_id = org_id
  ORDER BY p.created_at DESC;
END;
$$;