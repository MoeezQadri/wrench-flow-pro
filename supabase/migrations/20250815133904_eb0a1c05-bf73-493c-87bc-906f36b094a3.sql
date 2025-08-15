-- Fix critical security vulnerability in contact_submissions table
-- The current SELECT policy allows anyone to read all contact submissions

-- Drop the existing insecure SELECT policy
DROP POLICY IF EXISTS "Admin users can view contact submissions" ON public.contact_submissions;

-- Create a secure SELECT policy that only allows superadmins and admin/owner users to view contact submissions
CREATE POLICY "Admin users can view contact submissions" ON public.contact_submissions
FOR SELECT
USING (
  user_is_superadmin() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);

-- Keep the INSERT policy as is - anyone should be able to submit contact forms
-- Policy Name: "Anyone can submit contact form" - this is correct and secure

-- Add a comment to document the security fix
COMMENT ON POLICY "Admin users can view contact submissions" ON public.contact_submissions IS 
'Security fix: Only allow superadmins and organization owners/admins to view contact submissions containing sensitive customer data.';