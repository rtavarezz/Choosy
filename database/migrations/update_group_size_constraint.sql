-- Migration: Update group_size constraint to include 'date'
-- This allows the frontend to use 'date' for 2-person groups

-- Drop the existing check constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_group_size_check;

-- Add the new check constraint that includes 'date'
ALTER TABLE plans ADD CONSTRAINT plans_group_size_check 
CHECK (group_size IN ('solo', 'date', 'friend', 'group')); 