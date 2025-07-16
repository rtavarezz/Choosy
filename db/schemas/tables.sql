-- Choosy Database Schema
-- This file contains all table definitions for the application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL CHECK (phone ~ '^\+?[1-9]\d{1,14}$'), -- Phone number validation
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100), -- Name validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL CHECK (topic IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'gokart', 'swimming', 'drinks')), -- Topic validation
  group_size TEXT NOT NULL CHECK (group_size IN ('solo', 'date', 'group')), -- Group size validation
  zip_code TEXT NOT NULL CHECK (zip_code ~ '^\d{5}(-\d{4})?$'), -- ZIP code validation
  host_name TEXT NOT NULL CHECK (length(host_name) >= 1 AND length(host_name) <= 100), -- Name validation
  host_phone TEXT NOT NULL CHECK (host_phone ~ '^\+?[1-9]\d{1,14}$'), -- Phone validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  is_active BOOLEAN DEFAULT TRUE
);

-- Events table (from external APIs + custom events)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200), -- Name validation
  image TEXT CHECK (image IS NULL OR image ~ '^https?://'), -- URL validation
  hours TEXT CHECK (length(hours) <= 100), -- Hours validation
  contact JSONB CHECK (contact IS NULL OR jsonb_typeof(contact) = 'object'), -- JSON validation
  source_type TEXT NOT NULL CHECK (source_type IN ('yelp', 'ticketmaster', 'custom', 'google', 'eventbrite')), -- Source validation
  external_id TEXT, -- ID from external API
  votes_count INTEGER DEFAULT 0 CHECK (votes_count >= 0), -- Vote count validation
  metadata JSONB CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'), -- JSON validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL CHECK (length(voter_id) >= 10), -- Voter ID validation
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')), -- Vote type validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, event_id, voter_id) -- Prevent duplicate votes
);

-- Custom events table (user-submitted events)
CREATE TABLE IF NOT EXISTS custom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200), -- Name validation
  description TEXT CHECK (length(description) <= 1000), -- Description validation
  contact JSONB CHECK (contact IS NULL OR jsonb_typeof(contact) = 'object'), -- JSON validation
  created_by TEXT NOT NULL CHECK (created_by ~ '^\+?[1-9]\d{1,14}$'), -- Phone validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_plans_topic ON plans(topic);
CREATE INDEX IF NOT EXISTS idx_plans_group_size ON plans(group_size);
CREATE INDEX IF NOT EXISTS idx_plans_zip_code ON plans(zip_code);
CREATE INDEX IF NOT EXISTS idx_plans_host_phone ON plans(host_phone);
CREATE INDEX IF NOT EXISTS idx_events_plan_id ON events(plan_id);
CREATE INDEX IF NOT EXISTS idx_events_source_type ON events(source_type);
CREATE INDEX IF NOT EXISTS idx_votes_plan_id ON votes(plan_id);
CREATE INDEX IF NOT EXISTS idx_votes_event_id ON votes(event_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_custom_events_plan_id ON custom_events(plan_id);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 