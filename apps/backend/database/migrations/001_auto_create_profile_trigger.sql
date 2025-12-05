-- =====================================================
-- Auto-create Profile Trigger
-- =====================================================
-- This trigger automatically creates a profile when a new user signs up
-- Fixes the issue where Google OAuth users don't get a profile created

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
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

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up via any auth provider (Google, email, etc.)';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to auto-create profile for new users';
