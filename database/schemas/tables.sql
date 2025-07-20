-- Choosy Database Schema
-- This file contains all table definitions for the application

-- Users table (Enhanced for multi-million dollar features)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL CHECK (phone ~ '^\+?[1-9]\d{1,14}$'), -- Phone number validation
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100), -- Name validation
  email TEXT UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Email validation
  avatar_url TEXT CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://'), -- Avatar URL validation
  preferences JSONB DEFAULT '{}', -- User preferences (categories, price ranges, etc.)
  ai_profile JSONB DEFAULT '{}', -- AI learning profile (event patterns, preferences)
  gamification JSONB DEFAULT '{"points": 0, "level": 1, "streak": 0, "achievements": []}', -- Gamification data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences table (for AI learning)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family')),
  preference_score FLOAT DEFAULT 0.5 CHECK (preference_score >= 0 AND preference_score <= 1), -- 0 = dislike, 1 = love
  interaction_count INTEGER DEFAULT 0 CHECK (interaction_count >= 0), -- How many times they've interacted with this category
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- User Event History (for AI learning)
CREATE TABLE IF NOT EXISTS user_event_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'liked', 'disliked', 'voted', 'attended', 'shared')),
  interaction_data JSONB DEFAULT '{}', -- Additional interaction data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Learning Profiles (for personalized recommendations)
CREATE TABLE IF NOT EXISTS ai_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}', -- AI learning data
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Gamification Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('first_plan', 'voter_streak', 'category_explorer', 'social_butterfly', 'adventure_seeker', 'foodie_master', 'nightlife_king', 'culture_vulture')),
  achievement_data JSONB DEFAULT '{}', -- Achievement specific data
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- User Sessions (for tracking engagement)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL CHECK (topic IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family')), -- Topic validation
  group_size TEXT NOT NULL CHECK (group_size IN ('solo', 'date', 'friend', 'group')), -- Group size validation
  zip_code TEXT NOT NULL CHECK (zip_code ~ '^[A-Z0-9\s\-]{3,10}$'), -- International postal code validation (3-10 alphanumeric chars, spaces, hyphens)
  host_name TEXT NOT NULL CHECK (length(host_name) >= 1 AND length(host_name) <= 100), -- Name validation
  host_phone TEXT NOT NULL CHECK (host_phone ~ '^\+?[1-9]\d{1,14}$'), -- Phone validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  is_active BOOLEAN DEFAULT TRUE
);

-- User Plans table (simple tracking of user involvement)
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL, -- Use phone as identifier (simpler than UUID)
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'voter')), -- User's role in the plan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_phone, plan_id) -- Prevent duplicate entries
);

-- Events table (from external APIs + custom events)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200), -- Name validation
  image TEXT CHECK (image IS NULL OR image ~ '^https?://'), -- URL validation
  hours TEXT CHECK (length(hours) <= 100), -- Hours validation
  contact JSONB CHECK (contact IS NULL OR jsonb_typeof(contact) = 'object'), -- JSON validation
  source_type TEXT NOT NULL CHECK (source_type IN ('yelp', 'ticketmaster', 'custom', 'google', 'eventbrite', 'mock', 'local')), -- Source validation
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_category ON user_preferences(category);
CREATE INDEX IF NOT EXISTS idx_user_event_history_user_id ON user_event_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_history_event_id ON user_event_history(event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_history_interaction_type ON user_event_history(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_user_id ON ai_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_plans_topic ON plans(topic);
CREATE INDEX IF NOT EXISTS idx_plans_group_size ON plans(group_size);
CREATE INDEX IF NOT EXISTS idx_plans_zip_code ON plans(zip_code);
CREATE INDEX IF NOT EXISTS idx_plans_host_phone ON plans(host_phone);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_phone ON user_plans(user_phone);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON user_plans(plan_id);
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

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 