-- Fix missing tables for Choosy backend
-- This script creates the missing ai_user_profiles table

-- AI Learning Profiles (for personalized recommendations)
CREATE TABLE IF NOT EXISTS ai_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}', -- AI learning data
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_user_id ON ai_user_profiles(user_id);

-- Also ensure other potentially missing tables exist
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family')),
  preference_score FLOAT DEFAULT 0.5 CHECK (preference_score >= 0 AND preference_score <= 1),
  interaction_count INTEGER DEFAULT 0 CHECK (interaction_count >= 0),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE TABLE IF NOT EXISTS user_event_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'liked', 'disliked', 'voted', 'attended', 'shared')),
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('first_plan', 'voter_streak', 'category_explorer', 'social_butterfly', 'adventure_seeker', 'foodie_master', 'nightlife_king', 'culture_vulture')),
  achievement_data JSONB DEFAULT '{}',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_category ON user_preferences(category);
CREATE INDEX IF NOT EXISTS idx_user_event_history_user_id ON user_event_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_history_event_id ON user_event_history(event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_history_interaction_type ON user_event_history(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token); 