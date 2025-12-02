-- =====================================================
-- Create Missing Profiles
-- =====================================================
-- This migration creates profiles for existing users who don't have one yet
-- (e.g., users who signed up before the auto-create trigger was added)

-- Insert profiles for users who don't have one
INSERT INTO public.profiles (user_id, display_name, avatar_url, created_at, updated_at)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'User'
  ) as display_name,
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ) as avatar_url,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL;

-- Log how many profiles were created
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  RAISE NOTICE 'Total profiles after migration: %', profile_count;
END $$;
