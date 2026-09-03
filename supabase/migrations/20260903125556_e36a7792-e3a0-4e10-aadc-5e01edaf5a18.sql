REVOKE EXECUTE ON FUNCTION public.prevent_customer_protected_field_changes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_customer_protected_field_changes() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_customer_protected_field_changes() FROM authenticated;