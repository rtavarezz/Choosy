-- Add new topics to the plans table
-- This migration adds support for the new topics we added to the frontend

-- Drop the existing check constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_topic_check;

-- Add the new check constraint with all topics
ALTER TABLE plans ADD CONSTRAINT plans_topic_check 
CHECK (topic IN (
    'concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 
    'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 
    'shopping', 'wellness', 'adventure', 'family'
));

-- Also update the events table source_type constraint to include new sources
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_source_type_check;

-- Add the new source types
ALTER TABLE events ADD CONSTRAINT events_source_type_check 
CHECK (source_type IN (
    'yelp', 'ticketmaster', 'custom', 'google', 'eventbrite', 
    'meetup', 'facebook', 'partner', 'local'
)); 