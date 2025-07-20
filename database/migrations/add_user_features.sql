-- Migration: Add user features 
-- This adds authentication, AI learning, gamification, and user preferences

-- Add new columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://');
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_profile JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamification JSONB DEFAULT '{"points": 0, "level": 1, "streak": 0, "achievements": []}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create new tables for user features
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

CREATE TABLE IF NOT EXISTS ai_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
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

-- Add indexes for performance
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

-- Add trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 