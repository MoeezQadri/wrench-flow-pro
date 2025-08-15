-- Fix critical security vulnerability in subscribers table
-- The current UPDATE policy allows any user to update any subscription record

-- Drop the existing insecure UPDATE policy
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create a secure UPDATE policy that only allows users to update their own subscriptions
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid() OR email = auth.email())
WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Also ensure the user_id column should not be nullable for better security
-- (keeping email as backup identifier for edge cases)
-- Note: Not changing nullability now to avoid breaking existing data

-- Add a comment to document the security fix
COMMENT ON POLICY "update_own_subscription" ON public.subscribers IS 
'Security fix: Only allow users to update their own subscription records. Edge functions bypass RLS using service role key.';