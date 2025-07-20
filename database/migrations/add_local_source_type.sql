-- Migration: Add 'local' to allowed source_type values
-- This allows local adventure templates to be saved to the database

-- Drop the existing constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_source_type_check;

-- Add the new constraint with 'local' included
ALTER TABLE events ADD CONSTRAINT events_source_type_check 
CHECK (source_type IN ('yelp', 'ticketmaster', 'custom', 'google', 'eventbrite', 'mock', 'local')); 