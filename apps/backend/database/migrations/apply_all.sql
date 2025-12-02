-- =====================================================
-- Apply All Migrations - Profile Auto-Creation Fix
-- =====================================================
-- Execute this file in Supabase SQL Editor to fix the profile creation issue

-- Step 1: Create the auto-create profile trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Create profiles for existing users without one
-- =====================================================
INSERT INTO public.profiles (user_id, display_name, avatar_url, created_at, updated_at)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'User'
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ),
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL;

-- Step 3: Verification
-- =====================================================
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE p.user_id IS NULL;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total users: %', user_count;
  RAISE NOTICE 'Total profiles: %', profile_count;
  RAISE NOTICE 'Missing profiles: %', missing_count;
  RAISE NOTICE '';

  IF missing_count = 0 THEN
    RAISE NOTICE '✅ All users now have profiles!';
  ELSE
    RAISE WARNING '⚠️  Still % users without profiles', missing_count;
  END IF;
END $$;

-- Display all users and their profiles
SELECT
  au.id as user_id,
  au.email,
  p.display_name,
  p.avatar_url,
  CASE WHEN p.user_id IS NULL THEN '❌' ELSE '✅' END as has_profile
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
ORDER BY au.created_at DESC;
