-- Update topic constraint to include all frontend topics
-- This migration adds the missing topics to the plans_topic_check constraint

-- Drop the existing constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_topic_check;

-- Add the new constraint with all topics
ALTER TABLE plans ADD CONSTRAINT plans_topic_check 
CHECK (topic IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family')); 