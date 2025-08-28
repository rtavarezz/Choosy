-- =====================================================
-- CHOOSY DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Users table (core authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for social login
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Profile info (optional, built progressively)
    display_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    
    -- Social login
    google_id VARCHAR(255) UNIQUE,
    apple_id VARCHAR(255) UNIQUE,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- User sessions (for JWT refresh)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SOCIAL FEATURES
-- =====================================================

-- Friends table (bidirectional relationships)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, friend_id),
    CONSTRAINT different_users CHECK (user_id != friend_id)
);

-- User groups (for recurring planning)
CREATE TABLE user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Group members
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- =====================================================
-- PLANS & EVENTS (Enhanced)
-- =====================================================

-- Plans table (enhanced with user ownership)
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for guest users
    topic VARCHAR(100) NOT NULL,
    group_size VARCHAR(20) NOT NULL CHECK (group_size IN ('solo', 'date', 'friend', 'family', 'work')),
    zip_code VARCHAR(20) NOT NULL,
    host_name VARCHAR(100) NOT NULL,
    host_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '15 minutes',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Enhanced fields
    title VARCHAR(200), -- "Dinner with Sarah" instead of just "food"
    description TEXT,
    group_id UUID REFERENCES user_groups(id), -- Link to user group
    is_public BOOLEAN DEFAULT FALSE, -- Allow sharing
    share_code VARCHAR(10) UNIQUE, -- For easy sharing
    
    -- Constraints
    CONSTRAINT valid_host_phone CHECK (host_phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT valid_zip_code CHECK (zip_code ~* '^[A-Za-z0-9\s-]{3,10}$')
);

-- Events table (enhanced)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    image TEXT,
    hours TEXT,
    source_type VARCHAR(50) NOT NULL,
    votes_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enhanced fields
    external_id VARCHAR(255), -- For deduplication
    external_url TEXT,
    price_range VARCHAR(20), -- "$", "$$", "$$$"
    rating DECIMAL(3,2), -- 4.5 stars
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE
);

-- Votes table (enhanced with user tracking)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    voter_id VARCHAR(100) NOT NULL, -- Can be user_id or guest_id
    voter_type VARCHAR(20) DEFAULT 'guest' CHECK (voter_type IN ('user', 'guest')),
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('like', 'dislike', 'super_like')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(plan_id, event_id, voter_id)
);

-- =====================================================
-- USER PREFERENCES & HISTORY
-- =====================================================

-- User favorites (saved places)
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, external_id, source_type)
);

-- User activity history
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'plan_created', 'vote_cast', 'favorite_added'
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- User notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'friend_request', 'plan_invite', 'vote_update'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_apple_id ON users(apple_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Sessions
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Plans
CREATE INDEX idx_plans_created_by ON plans(created_by);
CREATE INDEX idx_plans_share_code ON plans(share_code);
CREATE INDEX idx_plans_created_at ON plans(created_at);
CREATE INDEX idx_plans_expires_at ON plans(expires_at);

-- Events
CREATE INDEX idx_events_plan_id ON events(plan_id);
CREATE INDEX idx_events_external_id ON events(external_id);
CREATE INDEX idx_events_votes_count ON events(votes_count);

-- Votes
CREATE INDEX idx_votes_plan_id ON votes(plan_id);
CREATE INDEX idx_votes_event_id ON votes(event_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);

-- Friendships
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Activity
CREATE INDEX idx_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_activity_created_at ON user_activity(created_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Plans: creators can manage, others can view if public or invited
CREATE POLICY "Plans are viewable by creator or if public" ON plans
    FOR SELECT USING (
        created_by = auth.uid() OR 
        is_public = true OR 
        share_code IS NOT NULL
    );

CREATE POLICY "Plans can be created by authenticated users" ON plans
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Plans can be updated by creator" ON plans
    FOR UPDATE USING (created_by = auth.uid());

-- Events: viewable if plan is viewable
CREATE POLICY "Events are viewable if plan is viewable" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM plans 
            WHERE plans.id = events.plan_id 
            AND (plans.created_by = auth.uid() OR plans.is_public = true)
        )
    );

-- Votes: anyone can vote on public plans
CREATE POLICY "Votes can be created on public plans" ON votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM plans 
            WHERE plans.id = votes.plan_id 
            AND (plans.is_public = true OR plans.share_code IS NOT NULL)
        )
    );

-- Friendships: users can manage their own friendships
CREATE POLICY "Users can manage own friendships" ON friendships
    FOR ALL USING (user_id = auth.uid() OR friend_id = auth.uid());

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_code IS NULL THEN
        NEW.share_code := upper(substring(md5(random()::text) from 1 for 8));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_plan_share_code BEFORE INSERT ON plans
    FOR EACH ROW EXECUTE FUNCTION generate_share_code();

-- Update vote counts
CREATE OR REPLACE FUNCTION update_event_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events 
        SET votes_count = votes_count + 1 
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET votes_count = votes_count - 1 
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vote_count AFTER INSERT OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_event_vote_count(); 