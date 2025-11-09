-- Create Admin Accounts for WIRsuchen
-- Run this migration in Supabase SQL Editor

-- Note: Supabase auth.users requires special handling
-- We'll insert into profiles and you'll need to create auth users via Supabase Dashboard or API

-- First, let's create a function to safely create admin profiles
CREATE OR REPLACE FUNCTION create_admin_profile(
  p_email TEXT,
  p_full_name TEXT,
  p_role user_role
) RETURNS uuid AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Generate a UUID for the profile
  v_profile_id := gen_random_uuid();
  
  -- Insert profile (user_id will be updated after auth user is created)
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    email_verified
  ) VALUES (
    v_profile_id,
    p_email,
    p_full_name,
    p_role,
    true,
    true
  )
  ON CONFLICT (email) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    is_active = true,
    email_verified = true;
  
  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Create admin profiles for all roles
DO $$
BEGIN
  PERFORM create_admin_profile('supervisor@wirsuchen.com', 'Supervisor Admin', 'supervisor');
  PERFORM create_admin_profile('admin@wirsuchen.com', 'Admin User', 'admin');
  PERFORM create_admin_profile('moderator@wirsuchen.com', 'Moderator User', 'moderator');
  PERFORM create_admin_profile('lister@wirsuchen.com', 'Lister User', 'lister');
  PERFORM create_admin_profile('publisher@wirsuchen.com', 'Publisher User', 'publisher');
  PERFORM create_admin_profile('blogger@wirsuchen.com', 'Blogger User', 'blogger');
  PERFORM create_admin_profile('editor@wirsuchen.com', 'Editor User', 'editor');
  PERFORM create_admin_profile('analyst@wirsuchen.com', 'Analyst User', 'analyst');
  
  RAISE NOTICE 'Admin profiles created successfully';
END $$;

-- Verify creation
SELECT email, full_name, role, is_active 
FROM profiles 
WHERE email LIKE '%@wirsuchen.com' 
ORDER BY 
  CASE role
    WHEN 'supervisor' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    WHEN 'lister' THEN 4
    WHEN 'publisher' THEN 5
    WHEN 'blogger' THEN 6
    WHEN 'editor' THEN 7
    WHEN 'analyst' THEN 8
  END;
