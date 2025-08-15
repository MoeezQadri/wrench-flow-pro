-- Fix security issue: Customer Contact Information Could Be Stolen by Hackers
-- This migration strengthens RLS policies for the customers table to prevent unauthorized access

-- First, let's make organization_id NOT NULL in customers table to prevent NULL-based security bypasses
-- Update any existing NULL values to a default organization first
UPDATE public.customers 
SET organization_id = '00000000-0000-0000-0000-000000000001' 
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL
ALTER TABLE public.customers 
ALTER COLUMN organization_id SET NOT NULL;

-- Drop existing RLS policies for customers table
DROP POLICY IF EXISTS "Org members can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can read customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can update customers" ON public.customers;

-- Create improved RLS policies with better NULL handling and security
-- Policy for SELECT - Users can only read customers from their organization
CREATE POLICY "Customers can only be viewed by org members" 
ON public.customers 
FOR SELECT 
USING (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org() AND current_user_org() IS NOT NULL)
);

-- Policy for INSERT - Users can only create customers for their organization
CREATE POLICY "Customers can only be created for user's org" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org() AND current_user_org() IS NOT NULL)
);

-- Policy for UPDATE - Users can only update customers from their organization
CREATE POLICY "Customers can only be updated by org members" 
ON public.customers 
FOR UPDATE 
USING (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org() AND current_user_org() IS NOT NULL)
)
WITH CHECK (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org() AND current_user_org() IS NOT NULL)
);

-- Policy for DELETE - Users can only delete customers from their organization  
CREATE POLICY "Customers can only be deleted by org members" 
ON public.customers 
FOR DELETE 
USING (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org() AND current_user_org() IS NOT NULL)
);

-- Add a trigger to automatically set organization_id for new customers
CREATE OR REPLACE FUNCTION set_customer_org_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure organization_id is set for new customers
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := current_user_org();
  END IF;
  
  -- Ensure only members of the organization can create customers for that org
  IF NOT user_is_superadmin() AND (NEW.organization_id IS NULL OR NEW.organization_id != current_user_org()) THEN
    RAISE EXCEPTION 'You can only create customers for your own organization';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT operations
CREATE TRIGGER set_customer_org_trigger
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_org_id();

-- Also create an improved version of current_user_org function with better error handling
CREATE OR REPLACE FUNCTION public.current_user_org_secure()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT organization_id 
     FROM public.profiles 
     WHERE id = auth.uid() 
     AND is_active = true 
     LIMIT 1),
    ''
  );
$$;

-- Update existing policies to use the more secure function
DROP POLICY IF EXISTS "Customers can only be viewed by org members" ON public.customers;
DROP POLICY IF EXISTS "Customers can only be created for user's org" ON public.customers;
DROP POLICY IF EXISTS "Customers can only be updated by org members" ON public.customers;
DROP POLICY IF EXISTS "Customers can only be deleted by org members" ON public.customers;

-- Recreate policies with the secure function
CREATE POLICY "Customers can only be viewed by org members" 
ON public.customers 
FOR SELECT 
USING (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org_secure() AND current_user_org_secure() != '')
);

CREATE POLICY "Customers can only be created for user's org" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org_secure() AND current_user_org_secure() != '')
);

CREATE POLICY "Customers can only be updated by org members" 
ON public.customers 
FOR UPDATE 
USING (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org_secure() AND current_user_org_secure() != '')
)
WITH CHECK (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org_secure() AND current_user_org_secure() != '')
);

CREATE POLICY "Customers can only be deleted by org members" 
ON public.customers 
FOR DELETE 
USING (
  user_is_superadmin() OR 
  (organization_id IS NOT NULL AND organization_id = current_user_org_secure() AND current_user_org_secure() != '')
);