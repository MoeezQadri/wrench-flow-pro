-- Fix organization_id data type in profiles table to match organizations.id
ALTER TABLE public.profiles 
ALTER COLUMN organization_id TYPE uuid USING organization_id::uuid;