-- Migration: Add push tokens support for Expo Push Notifications
-- Description: Adds push_tokens column to profiles table to store Expo push notification tokens
-- Author: Claude Code
-- Date: 2025-12-09

-- Add push tokens array to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_tokens JSONB DEFAULT '[]';

-- Add index for faster token queries using GIN index for JSONB
CREATE INDEX IF NOT EXISTS idx_profiles_push_tokens
ON profiles USING GIN (push_tokens);

-- Add column comment for documentation
COMMENT ON COLUMN profiles.push_tokens IS 'Array of Expo push notification tokens for user devices. Stores multiple tokens to support multiple devices per user.';

-- Verify the column was added (for logging purposes)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'push_tokens';
