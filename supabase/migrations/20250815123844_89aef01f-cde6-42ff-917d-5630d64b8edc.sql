-- Add missing policy for DELETE on subscribers table
CREATE POLICY "delete_own_subscription" ON public.subscribers
FOR DELETE
USING (user_id = auth.uid());