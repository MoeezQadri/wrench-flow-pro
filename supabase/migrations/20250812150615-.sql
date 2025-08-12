-- Fix RLS policy for organizations to handle proper UUID to text conversion
DROP POLICY IF EXISTS "Users can read their organization" ON public.organizations;

CREATE POLICY "Users can read their organization" 
ON public.organizations 
FOR SELECT 
USING (user_is_superadmin() OR (id::text = current_user_org()));

-- Add policy for updating organizations 
CREATE POLICY "Org owners and admins can update their organization" 
ON public.organizations 
FOR UPDATE
USING (user_is_superadmin() OR (id::text = current_user_org()))
WITH CHECK (user_is_superadmin() OR (id::text = current_user_org()));