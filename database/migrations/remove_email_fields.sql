-- Migration: Remove email fields from database
-- Date: 2024-01-25
-- Description: Remove email-related fields and constraints since we're not using email functionality

-- Remove email column from users table
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- Remove email_verified column from users table  
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

-- Drop email verification tokens table
DROP TABLE IF EXISTS email_verification_tokens;

-- Drop password reset tokens table (email-based)
DROP TABLE IF EXISTS password_reset_tokens;

-- Drop email index
DROP INDEX IF EXISTS idx_users_email;

-- Update group_size constraint to use new values
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_group_size_check;
ALTER TABLE plans ADD CONSTRAINT plans_group_size_check 
  CHECK (group_size IN ('myself', '2', '3+'));

-- Add comment to document the change
COMMENT ON TABLE users IS 'Users table - phone-based authentication only (email removed)'; 