-- Update existing 'admin' users to 'owner' to give them full permissions
-- This ensures all organization creators have proper access

UPDATE public.profiles 
SET role = 'owner' 
WHERE role = 'admin';