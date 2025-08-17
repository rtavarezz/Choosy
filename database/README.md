# Choosy Database Documentation

## Overview

The Choosy database is built on PostgreSQL with Supabase, designed to support intelligent event planning with AI-powered recommendations, user authentication, and gamification features.

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL CHECK (phone ~ '^\+?[1-9]\d{1,14}$'),
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  email TEXT UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  avatar_url TEXT CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://'),
  preferences JSONB DEFAULT '{}',
  ai_profile JSONB DEFAULT '{}',
  gamification JSONB DEFAULT '{"points": 0, "level": 1, "streak": 0, "achievements": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Store user account information, preferences, and gamification data.

#### Plans
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL CHECK (topic IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family')),
  group_size TEXT NOT NULL CHECK (group_size IN ('solo', 'date', 'friend', 'group')),
  zip_code TEXT NOT NULL CHECK (zip_code ~ '^[A-Z0-9\s\-]{3,10}$'),
  host_name TEXT NOT NULL CHECK (length(host_name) >= 1 AND length(host_name) <= 100),
  host_phone TEXT NOT NULL CHECK (host_phone ~ '^\+?[1-9]\d{1,14}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  is_active BOOLEAN DEFAULT TRUE
);
```

**Purpose**: Store event planning sessions with voting windows.

#### Events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
  image TEXT CHECK (image IS NULL OR image ~ '^https?://'),
  hours TEXT CHECK (length(hours) <= 100),
  contact JSONB CHECK (contact IS NULL OR jsonb_typeof(contact) = 'object'),
  source_type TEXT NOT NULL CHECK (source_type IN ('yelp', 'ticketmaster', 'custom', 'google', 'eventbrite', 'mock', 'local')),
  external_id TEXT,
  votes_count INTEGER DEFAULT 0 CHECK (votes_count >= 0),
  metadata JSONB CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Store events from various sources with voting data.

### AI & Learning Tables

#### User Preferences
```sql
CREATE TABLE user_preferences (
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
```

**Purpose**: Track user preferences for AI learning and recommendations.

#### User Event History
```sql
CREATE TABLE user_event_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'liked', 'disliked', 'voted', 'attended', 'shared')),
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Track all user interactions for AI learning and analytics.

#### AI User Profiles
```sql
CREATE TABLE ai_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Purpose**: Store AI learning data and user behavior patterns.

### Gamification Tables

#### User Achievements
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('first_plan', 'voter_streak', 'category_explorer', 'social_butterfly', 'adventure_seeker', 'foodie_master', 'nightlife_king', 'culture_vulture')),
  achievement_data JSONB DEFAULT '{}',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);
```

**Purpose**: Track user achievements and milestones.

#### User Sessions
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Manage user authentication sessions.

### Supporting Tables

#### Votes
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL CHECK (length(voter_id) >= 10),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, event_id, voter_id)
);
```

**Purpose**: Track individual votes on events.

#### Custom Events
```sql
CREATE TABLE custom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
  description TEXT CHECK (length(description) <= 1000),
  contact JSONB CHECK (contact IS NULL OR jsonb_typeof(contact) = 'object'),
  created_by TEXT NOT NULL CHECK (created_by ~ '^\+?[1-9]\d{1,14}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Store user-created custom events.

## Indexes

### Performance Indexes
```sql
-- User indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active);

-- Plan indexes
CREATE INDEX idx_plans_topic ON plans(topic);
CREATE INDEX idx_plans_group_size ON plans(group_size);
CREATE INDEX idx_plans_zip_code ON plans(zip_code);
CREATE INDEX idx_plans_host_phone ON plans(host_phone);

-- Event indexes
CREATE INDEX idx_events_plan_id ON events(plan_id);
CREATE INDEX idx_events_source_type ON events(source_type);

-- Vote indexes
CREATE INDEX idx_votes_plan_id ON votes(plan_id);
CREATE INDEX idx_votes_event_id ON votes(event_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);

-- AI indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_category ON user_preferences(category);
CREATE INDEX idx_user_event_history_user_id ON user_event_history(user_id);
CREATE INDEX idx_user_event_history_event_id ON user_event_history(event_id);
CREATE INDEX idx_user_event_history_interaction_type ON user_event_history(interaction_type);

-- Session indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
```

## Data Relationships

### Entity Relationship Diagram

```
Users (1) ----< UserPreferences (N)
Users (1) ----< UserEventHistory (N)
Users (1) ----< UserAchievements (N)
Users (1) ----< UserSessions (N)
Users (1) ----< AIUserProfiles (1)

Plans (1) ----< Events (N)
Plans (1) ----< Votes (N)
Plans (1) ----< CustomEvents (N)

Events (1) ----< Votes (N)
Events (1) ----< UserEventHistory (N)
```

## Data Validation

### Constraints
- **Phone Validation**: International phone number format
- **Email Validation**: Standard email format
- **URL Validation**: HTTPS/HTTP URLs only
- **JSON Validation**: Proper JSON structure
- **Length Limits**: Prevent oversized data
- **Enum Values**: Restricted to valid options

### Triggers
```sql
-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Data Types

### JSONB Usage
- **User Preferences**: Flexible preference storage
- **Event Metadata**: Rich event information
- **Contact Information**: Structured contact data
- **AI Profile Data**: Complex learning data
- **Gamification Data**: Points, levels, achievements
- **Interaction Data**: Contextual interaction info

### UUID Usage
- All primary keys use UUID for security
- Prevents sequential ID enumeration
- Enables distributed systems
- Better for privacy

## Security

### Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_event_history ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Data Encryption
- **At Rest**: Supabase handles encryption
- **In Transit**: TLS/SSL encryption
- **Sensitive Fields**: Phone numbers, emails

## Backup & Recovery

### Backup Strategy
- **Automated Backups**: Daily automated backups
- **Point-in-Time Recovery**: 7-day retention
- **Cross-Region Replication**: Disaster recovery
- **Export Options**: CSV, JSON, SQL dumps

### Recovery Procedures
1. **Data Restoration**: Point-in-time recovery
2. **Schema Changes**: Migration rollbacks
3. **User Data**: Selective restoration
4. **Audit Trail**: Complete change history

## Performance

### Query Optimization
- **Indexed Queries**: All common queries indexed
- **JSONB Queries**: Efficient JSON operations
- **Connection Pooling**: Optimized connections
- **Query Caching**: Result caching where appropriate

### Monitoring
- **Query Performance**: Slow query detection
- **Index Usage**: Index efficiency monitoring
- **Connection Counts**: Resource utilization
- **Error Rates**: Database error tracking

## Migrations

### Migration Files
- `add_audit_fields.sql`: Add audit timestamps
- `add_friend_group_size.sql`: Add group size options
- `add_voter_participation.sql`: Track voting participation
- `add_local_source_type.sql`: Add local event support
- `add_user_features.sql`: Add AI and gamification features

### Migration Process
1. **Development**: Test migrations locally
2. **Staging**: Apply to staging environment
3. **Production**: Apply during maintenance window
4. **Rollback**: Keep rollback scripts ready

## Analytics

### Key Metrics
- **User Engagement**: Daily active users
- **Event Discovery**: Events per plan
- **Voting Patterns**: Vote distribution
- **AI Learning**: Recommendation accuracy
- **Gamification**: Achievement unlock rates

### Data Warehouse
- **Aggregated Data**: Daily/weekly summaries
- **User Cohorts**: Behavior analysis
- **Event Performance**: Popular events
- **AI Insights**: Learning effectiveness

## Future Enhancements

### Planned Features
- **Real-time Analytics**: Live data streaming
- **Advanced AI**: Machine learning models
- **Social Features**: Friend connections
- **Location Services**: Geospatial queries
- **Notification System**: Event alerts

### Scalability
- **Sharding**: Horizontal scaling
- **Read Replicas**: Load distribution
- **Caching Layer**: Redis integration
- **CDN**: Static asset delivery

# Database

SQL migrations, schemas, and queries for Choosy.

- `migrations/`: SQL migration scripts.
- `schemas/`: Database schema definitions.
- `queries/`: Common SQL queries.
- `test/`: Test data/scripts.

## Usage

- Run migrations as needed for DB updates.
- See `fix_missing_tables.sql` for repair scripts.