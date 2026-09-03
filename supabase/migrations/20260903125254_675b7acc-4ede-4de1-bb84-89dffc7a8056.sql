DROP POLICY IF EXISTS "Customers can only be updated by org members" ON public.customers;

CREATE POLICY "Customers can only be updated by org admins"
ON public.customers
FOR UPDATE
TO public
USING (
  user_is_superadmin()
  OR (
    organization_id IS NOT NULL
    AND organization_id = current_user_org_secure()
    AND current_user_org_secure() <> ''::text
    AND is_organization_admin()
  )
)
WITH CHECK (
  user_is_superadmin()
  OR (
    organization_id IS NOT NULL
    AND organization_id = current_user_org_secure()
    AND current_user_org_secure() <> ''::text
    AND is_organization_admin()
  )
);