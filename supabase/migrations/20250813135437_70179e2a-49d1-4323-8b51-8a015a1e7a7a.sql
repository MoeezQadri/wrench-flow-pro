-- Enable Row Level Security on superadmin_activity table
ALTER TABLE public.superadmin_activity ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if current user is a superadmin
-- This prevents recursive RLS issues
CREATE OR REPLACE FUNCTION public.is_current_user_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('superuser', 'superadmin')
  );
$$;

-- Policy: Only superadmins can read superadmin activity logs
CREATE POLICY "Superadmins can read activity logs"
ON public.superadmin_activity
FOR SELECT
TO authenticated
USING (public.is_current_user_superadmin());

-- Policy: Only superadmins can insert activity logs (for logging functions)
CREATE POLICY "Superadmins can insert activity logs"
ON public.superadmin_activity
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_superadmin());

-- Policy: Only superadmins can update activity logs (if needed)
CREATE POLICY "Superadmins can update activity logs"
ON public.superadmin_activity
FOR UPDATE
TO authenticated
USING (public.is_current_user_superadmin())
WITH CHECK (public.is_current_user_superadmin());

-- Policy: Only superadmins can delete activity logs (for cleanup)
CREATE POLICY "Superadmins can delete activity logs"
ON public.superadmin_activity
FOR DELETE
TO authenticated
USING (public.is_current_user_superadmin());

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.superadmin_activity TO authenticated;

-- Revoke any public access
REVOKE ALL ON public.superadmin_activity FROM anon;