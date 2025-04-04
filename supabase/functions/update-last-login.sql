
-- Create a function to update the lastLogin field
CREATE OR REPLACE FUNCTION update_last_login(user_id UUID, login_time TIMESTAMP WITH TIME ZONE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET "lastLogin" = login_time
  WHERE id = user_id;
END;
$$;
