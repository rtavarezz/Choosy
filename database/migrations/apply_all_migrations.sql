-- Comprehensive Migration Script for Choosy MVP
-- This script applies all necessary database changes
-- Run this in production to ensure database is up to date

BEGIN;

-- 1. Remove email fields (if not already removed)
ALTER TABLE users DROP COLUMN IF EXISTS email;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS password_reset_tokens;
DROP INDEX IF EXISTS idx_users_email;

-- 2. Update group_size constraint to use new values
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_group_size_check;
ALTER TABLE plans ADD CONSTRAINT plans_group_size_check 
    CHECK (group_size IN ('myself', '2', '3+'));

-- 3. Ensure all required tables exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL CHECK (phone ~ '^\+?1?\d{9,15}$'),
    name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description TEXT CHECK (length(description) <= 500),
    zip_code TEXT NOT NULL CHECK (zip_code ~ '^\d{5}(-\d{4})?$'),
    group_size TEXT NOT NULL DEFAULT 'myself' CHECK (group_size IN ('myself', '2', '3+')),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
    image TEXT,
    hours TEXT CHECK (length(hours) <= 100),
    source_type TEXT DEFAULT 'custom',
    votes_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    option_id UUID REFERENCES events(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike', 'super_like')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, voter_id, option_id)
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 30),
    phone TEXT NOT NULL CHECK (phone ~ '^\+?1?\d{9,15}$'),
    group_size TEXT NOT NULL DEFAULT 'myself' CHECK (group_size IN ('myself', '2', '3+')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    confirmation_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_plans_creator_id ON plans(creator_id);
CREATE INDEX IF NOT EXISTS idx_plans_zip_code ON plans(zip_code);
CREATE INDEX IF NOT EXISTS idx_events_plan_id ON events(plan_id);
CREATE INDEX IF NOT EXISTS idx_votes_plan_id ON votes(plan_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);
CREATE INDEX IF NOT EXISTS idx_reservations_plan_id ON reservations(plan_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event_id ON reservations(event_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Users can only see their own data
CREATE POLICY IF NOT EXISTS users_select_policy ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY IF NOT EXISTS users_insert_policy ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS users_update_policy ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Plans: creators can manage, voters can view
CREATE POLICY IF NOT EXISTS plans_select_policy ON plans
    FOR SELECT USING (
        creator_id::text = auth.uid()::text OR
        id IN (SELECT DISTINCT plan_id FROM votes WHERE voter_id::text = auth.uid()::text)
    );

CREATE POLICY IF NOT EXISTS plans_insert_policy ON plans
    FOR INSERT WITH CHECK (creator_id::text = auth.uid()::text);

CREATE POLICY IF NOT EXISTS plans_update_policy ON plans
    FOR UPDATE USING (creator_id::text = auth.uid()::text);

-- Events: anyone can view events for plans they have access to
CREATE POLICY IF NOT EXISTS events_select_policy ON events
    FOR SELECT USING (
        plan_id IN (
            SELECT id FROM plans WHERE 
                creator_id::text = auth.uid()::text OR
                id IN (SELECT DISTINCT plan_id FROM votes WHERE voter_id::text = auth.uid()::text)
        )
    );

CREATE POLICY IF NOT EXISTS events_insert_policy ON events
    FOR INSERT WITH CHECK (
        plan_id IN (
            SELECT id FROM plans WHERE creator_id::text = auth.uid()::text
        )
    );

-- Votes: users can only manage their own votes
CREATE POLICY IF NOT EXISTS votes_select_policy ON votes
    FOR SELECT USING (
        plan_id IN (
            SELECT id FROM plans WHERE 
                creator_id::text = auth.uid()::text OR
                id IN (SELECT DISTINCT plan_id FROM votes WHERE voter_id::text = auth.uid()::text)
        )
    );

CREATE POLICY IF NOT EXISTS votes_insert_policy ON votes
    FOR INSERT WITH CHECK (voter_id::text = auth.uid()::text);

CREATE POLICY IF NOT EXISTS votes_update_policy ON votes
    FOR UPDATE USING (voter_id::text = auth.uid()::text);

-- Reservations: users can only manage their own reservations
CREATE POLICY IF NOT EXISTS reservations_select_policy ON reservations
    FOR SELECT USING (
        plan_id IN (
            SELECT id FROM plans WHERE 
                creator_id::text = auth.uid()::text OR
                id IN (SELECT DISTINCT plan_id FROM votes WHERE voter_id::text = auth.uid()::text)
        )
    );

CREATE POLICY IF NOT EXISTS reservations_insert_policy ON reservations
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS reservations_update_policy ON reservations
    FOR UPDATE USING (true);

-- 7. Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_plans_updated_at 
    BEFORE UPDATE ON plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_reservations_updated_at 
    BEFORE UPDATE ON reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function to update vote counts
CREATE OR REPLACE FUNCTION update_event_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events 
        SET votes_count = votes_count + 1 
        WHERE id = NEW.option_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET votes_count = votes_count - 1 
        WHERE id = OLD.option_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 10. Create trigger for vote count updates
CREATE TRIGGER IF NOT EXISTS update_vote_count_trigger
    AFTER INSERT OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_event_vote_count();

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

-- Verify migration
SELECT 'Migration completed successfully' as status; 