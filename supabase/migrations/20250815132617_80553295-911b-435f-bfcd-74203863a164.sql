-- Fix security issue: Superadmin Sessions Could Be Accessed by Unauthorized Users
-- This migration adds proper RLS policies to the superadmin_sessions table

-- First, ensure RLS is enabled on superadmin_sessions table
ALTER TABLE public.superadmin_sessions ENABLE ROW LEVEL SECURITY;

-- Create highly restrictive RLS policies for superadmin_sessions
-- Only service role should be able to manage these sessions

-- Policy for SELECT: Only service role can read sessions
CREATE POLICY "Service role only can read superadmin sessions" 
ON public.superadmin_sessions 
FOR SELECT 
USING (false); -- No regular users should read sessions directly

-- Policy for INSERT: Only service role can create sessions
CREATE POLICY "Service role only can create superadmin sessions" 
ON public.superadmin_sessions 
FOR INSERT 
WITH CHECK (false); -- No regular users should create sessions directly

-- Policy for UPDATE: Only service role can update sessions
CREATE POLICY "Service role only can update superadmin sessions" 
ON public.superadmin_sessions 
FOR UPDATE 
USING (false) 
WITH CHECK (false); -- No regular users should update sessions directly

-- Policy for DELETE: Only service role can delete sessions
CREATE POLICY "Service role only can delete superadmin sessions" 
ON public.superadmin_sessions 
FOR DELETE 
USING (false); -- No regular users should delete sessions directly

-- Create a secure function to verify superadmin tokens that bypasses RLS
-- This replaces the existing function with better security
CREATE OR REPLACE FUNCTION public.verify_superadmin_token_secure(token_to_verify text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- This function runs with definer rights (bypasses RLS)
  -- Check if the token exists and is not expired
  SELECT * INTO v_session
  FROM public.superadmin_sessions
  WHERE token = token_to_verify
  AND expires_at > now();
  
  -- Return true if valid session found, false otherwise
  RETURN v_session IS NOT NULL;
END;
$$;

-- Create a secure function to clean up expired superadmin sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_superadmin_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleanup_count integer;
BEGIN
  -- This function runs with definer rights (bypasses RLS)
  -- Delete expired sessions
  DELETE FROM public.superadmin_sessions
  WHERE expires_at <= now();
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Log the cleanup action
  INSERT INTO public.superadmin_activity (
    superadmin_id,
    action_type,
    resource_type,
    resource_id,
    details
  ) VALUES (
    NULL, -- System action
    'cleanup',
    'superadmin_sessions',
    NULL,
    jsonb_build_object('expired_sessions_deleted', cleanup_count)
  );
  
  RETURN cleanup_count;
END;
$$;

-- Create a function to securely create superadmin sessions (used by edge functions)
CREATE OR REPLACE FUNCTION public.create_superadmin_session(
  p_superadmin_id uuid,
  p_token text,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- This function runs with definer rights (bypasses RLS)
  -- Insert new session
  INSERT INTO public.superadmin_sessions (
    superadmin_id,
    token,
    expires_at
  ) VALUES (
    p_superadmin_id,
    p_token,
    p_expires_at
  ) RETURNING id INTO v_session_id;
  
  -- Log the session creation
  INSERT INTO public.superadmin_activity (
    superadmin_id,
    action_type,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_superadmin_id,
    'login',
    'superadmin_sessions',
    v_session_id::text,
    jsonb_build_object('session_created', true)
  );
  
  RETURN v_session_id;
END;
$$;

-- Create a function to securely invalidate superadmin sessions
CREATE OR REPLACE FUNCTION public.invalidate_superadmin_session(token_to_invalidate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_record RECORD;
  v_deleted boolean := false;
BEGIN
  -- This function runs with definer rights (bypasses RLS)
  -- Find and delete the session
  DELETE FROM public.superadmin_sessions
  WHERE token = token_to_invalidate
  RETURNING superadmin_id, id INTO v_session_record;
  
  IF FOUND THEN
    v_deleted := true;
    
    -- Log the session invalidation
    INSERT INTO public.superadmin_activity (
      superadmin_id,
      action_type,
      resource_type,
      resource_id,
      details
    ) VALUES (
      v_session_record.superadmin_id,
      'logout',
      'superadmin_sessions',
      v_session_record.id::text,
      jsonb_build_object('session_invalidated', true)
    );
  END IF;
  
  RETURN v_deleted;
END;
$$;