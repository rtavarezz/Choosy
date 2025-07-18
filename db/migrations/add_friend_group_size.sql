-- Migration: Add 'friend' as valid group_size
-- This allows the frontend to use 'friend' instead of 'date' for 2-person groups

-- Drop the existing check constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_group_size_check;

-- Add the new check constraint that includes 'friend' (no 'date')
ALTER TABLE plans ADD CONSTRAINT plans_group_size_check 
CHECK (group_size IN ('solo', 'friend', 'group'));

-- Update any existing 'date' values to 'friend' for consistency (optional)
-- UPDATE plans SET group_size = 'friend' WHERE group_size = 'date'; 