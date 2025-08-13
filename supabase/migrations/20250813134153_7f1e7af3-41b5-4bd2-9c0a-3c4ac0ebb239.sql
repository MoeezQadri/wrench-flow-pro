-- Add documentation and ensure all predefined roles are recognized
-- The roles are stored as text in the profiles table, so we don't need a separate roles table
-- But we can add a check constraint to ensure only valid roles are used

-- First, let's add a comment to document the available roles
COMMENT ON COLUMN public.profiles.role IS 'User role: owner, admin, manager, foreman, mechanic, member, superuser, superadmin';

-- Add a check constraint to ensure only valid roles are used
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles 
CHECK (role IN ('owner', 'admin', 'manager', 'foreman', 'mechanic', 'member', 'superuser', 'superadmin'));

-- Update the default role for new users to 'member' (if not already set)
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'member';