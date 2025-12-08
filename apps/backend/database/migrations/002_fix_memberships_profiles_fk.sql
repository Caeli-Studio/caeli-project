-- Migration: Fix memberships to profiles foreign key relationship
-- This allows Supabase to properly join memberships with profiles

-- Step 1: Create missing profiles for users who have memberships but no profile
INSERT INTO profiles (user_id, display_name, pseudo)
SELECT DISTINCT
  m.user_id,
  COALESCE(u.email, 'User'), -- Use email as display name, or 'User' as fallback
  NULL -- No pseudo initially
FROM memberships m
LEFT JOIN profiles p ON m.user_id = p.user_id
INNER JOIN auth.users u ON m.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Drop the existing foreign key constraint on user_id (references auth.users)
ALTER TABLE memberships
  DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;

-- Step 3: Add a new foreign key constraint that references profiles(user_id) instead
ALTER TABLE memberships
  ADD CONSTRAINT memberships_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(user_id)
  ON DELETE CASCADE;

-- Refresh the schema cache (this is done automatically by Supabase when constraints change)
