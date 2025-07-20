-- Partner System Database Migration
-- Adds partner companies and their events to the Choosy platform

-- 1. Create partners table
CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY DEFAULT 'partner_' || gen_random_uuid()::text,
    company_name TEXT NOT NULL CHECK (length(company_name) >= 1 AND length(company_name) <= 200),
    contact_name TEXT NOT NULL CHECK (length(contact_name) >= 1 AND length(contact_name) <= 100),
    email TEXT UNIQUE NOT NULL CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone TEXT NOT NULL CHECK (phone ~ '^\+?[1-9]\d{1,14}$'),
    website TEXT NOT NULL CHECK (website ~ '^https?://'),
    business_type TEXT NOT NULL CHECK (length(business_type) >= 1 AND length(business_type) <= 100),
    description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 1000),
    categories JSONB NOT NULL CHECK (jsonb_typeof(categories) = 'array'),
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')) DEFAULT 'pending',
    api_key TEXT UNIQUE NOT NULL,
    api_secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT
);

-- 2. Create partner_events table
CREATE TABLE IF NOT EXISTS partner_events (
    id TEXT PRIMARY KEY DEFAULT 'partner_event_' || gen_random_uuid()::text,
    partner_id TEXT REFERENCES partners(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
    description TEXT CHECK (length(description) <= 2000),
    image_url TEXT CHECK (image_url IS NULL OR image_url ~ '^https?://'),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    venue TEXT NOT NULL CHECK (length(venue) >= 1 AND length(venue) <= 200),
    address TEXT NOT NULL CHECK (length(address) >= 1 AND length(address) <= 500),
    city TEXT NOT NULL CHECK (length(city) >= 1 AND length(city) <= 100),
    state TEXT NOT NULL CHECK (length(state) >= 1 AND length(state) <= 50),
    zip_code TEXT NOT NULL CHECK (zip_code ~ '^[A-Z0-9\s\-]{3,10}$'),
    price TEXT CHECK (length(price) <= 50),
    category TEXT NOT NULL CHECK (category IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'gokart', 'swimming', 'drinks')),
    tags JSONB DEFAULT '[]' CHECK (jsonb_typeof(tags) = 'array'),
    is_featured BOOLEAN DEFAULT FALSE,
    external_url TEXT CHECK (external_url IS NULL OR external_url ~ '^https?://'),
    contact_phone TEXT CHECK (contact_phone IS NULL OR contact_phone ~ '^\+?[1-9]\d{1,14}$'),
    contact_email TEXT CHECK (contact_email IS NULL OR contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending', 'rejected')) DEFAULT 'active',
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    votes_count INTEGER DEFAULT 0 CHECK (votes_count >= 0),
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    dislikes_count INTEGER DEFAULT 0 CHECK (dislikes_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create partner_analytics table
CREATE TABLE IF NOT EXISTS partner_analytics (
    id TEXT PRIMARY KEY DEFAULT 'analytics_' || gen_random_uuid()::text,
    partner_id TEXT REFERENCES partners(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    event_id TEXT REFERENCES partner_events(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    votes INTEGER DEFAULT 0 CHECK (votes >= 0),
    likes INTEGER DEFAULT 0 CHECK (likes >= 0),
    dislikes INTEGER DEFAULT 0 CHECK (dislikes >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_id, date, event_id)
);

-- 4. Create partner_event_votes table (for tracking individual votes)
CREATE TABLE IF NOT EXISTS partner_event_votes (
    id TEXT PRIMARY KEY DEFAULT 'partner_vote_' || gen_random_uuid()::text,
    partner_event_id TEXT REFERENCES partner_events(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL CHECK (length(voter_id) >= 10),
    vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_event_id, voter_id)
);

-- 5. Create partner_event_views table (for tracking views)
CREATE TABLE IF NOT EXISTS partner_event_views (
    id TEXT PRIMARY KEY DEFAULT 'partner_view_' || gen_random_uuid()::text,
    partner_event_id TEXT REFERENCES partner_events(id) ON DELETE CASCADE,
    viewer_id TEXT CHECK (length(viewer_id) >= 10),
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_tier ON partners(tier);
CREATE INDEX IF NOT EXISTS idx_partners_api_key ON partners(api_key);
CREATE INDEX IF NOT EXISTS idx_partner_events_partner_id ON partner_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_events_category ON partner_events(category);
CREATE INDEX IF NOT EXISTS idx_partner_events_status ON partner_events(status);
CREATE INDEX IF NOT EXISTS idx_partner_events_zip_code ON partner_events(zip_code);
CREATE INDEX IF NOT EXISTS idx_partner_events_start_time ON partner_events(start_time);
CREATE INDEX IF NOT EXISTS idx_partner_events_is_featured ON partner_events(is_featured);
CREATE INDEX IF NOT EXISTS idx_partner_events_votes_count ON partner_events(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_partner_analytics_partner_date ON partner_analytics(partner_id, date);
CREATE INDEX IF NOT EXISTS idx_partner_analytics_event_date ON partner_analytics(event_id, date);
CREATE INDEX IF NOT EXISTS idx_partner_event_votes_event_voter ON partner_event_votes(partner_event_id, voter_id);
CREATE INDEX IF NOT EXISTS idx_partner_event_views_event_time ON partner_event_views(partner_event_id, viewed_at);

-- 7. Add constraints
ALTER TABLE partner_events ADD CONSTRAINT IF NOT EXISTS check_end_after_start
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time);

ALTER TABLE partner_events ADD CONSTRAINT IF NOT EXISTS check_featured_limit
    CHECK (NOT is_featured OR (is_featured AND status = 'active'));

-- 8. Enable RLS on partner tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_event_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_event_views ENABLE ROW LEVEL SECURITY;

-- 9. Add RLS policies for partners table
CREATE POLICY "Partners can view own profile" ON partners
    FOR SELECT USING (id = auth.jwt() ->> 'partner_id');

CREATE POLICY "Partners can update own profile" ON partners
    FOR UPDATE USING (id = auth.jwt() ->> 'partner_id');

CREATE POLICY "Admin can view all partners" ON partners
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage all partners" ON partners
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 10. Add RLS policies for partner_events table
CREATE POLICY "Anyone can view active partner events" ON partner_events
    FOR SELECT USING (status = 'active');

CREATE POLICY "Partners can view own events" ON partner_events
    FOR SELECT USING (partner_id = auth.jwt() ->> 'partner_id');

CREATE POLICY "Partners can manage own events" ON partner_events
    FOR ALL USING (partner_id = auth.jwt() ->> 'partner_id');

CREATE POLICY "Admin can manage all partner events" ON partner_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 11. Add RLS policies for partner_analytics table
CREATE POLICY "Partners can view own analytics" ON partner_analytics
    FOR SELECT USING (partner_id = auth.jwt() ->> 'partner_id');

CREATE POLICY "System can insert analytics" ON partner_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view all analytics" ON partner_analytics
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 12. Add RLS policies for partner_event_votes table
CREATE POLICY "Anyone can view partner event votes" ON partner_event_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote on partner events" ON partner_event_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own partner votes" ON partner_event_votes
    FOR UPDATE USING (voter_id = auth.jwt() ->> 'phone');

-- 13. Add RLS policies for partner_event_views table
CREATE POLICY "System can insert partner event views" ON partner_event_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Partners can view own event views" ON partner_event_views
    FOR SELECT USING (
        partner_event_id IN (
            SELECT id FROM partner_events WHERE partner_id = auth.jwt() ->> 'partner_id'
        )
    );

-- 14. Create functions for partner event management
CREATE OR REPLACE FUNCTION increment_partner_event_views(event_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE partner_events 
    SET views_count = views_count + 1 
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_partner_event_vote_counts(event_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE partner_events 
    SET 
        votes_count = (
            SELECT COUNT(*) FROM partner_event_votes 
            WHERE partner_event_id = event_id
        ),
        likes_count = (
            SELECT COUNT(*) FROM partner_event_votes 
            WHERE partner_event_id = event_id AND vote_type = 'like'
        ),
        dislikes_count = (
            SELECT COUNT(*) FROM partner_event_votes 
            WHERE partner_event_id = event_id AND vote_type = 'dislike'
        )
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- 15. Create triggers for automatic updates
CREATE TRIGGER update_partner_event_vote_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON partner_event_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_event_vote_counts(COALESCE(NEW.partner_event_id, OLD.partner_event_id));

-- 16. Create views for partner analytics
CREATE OR REPLACE VIEW partner_dashboard AS
SELECT 
    p.id as partner_id,
    p.company_name,
    p.tier,
    p.status,
    COUNT(pe.id) as total_events,
    COUNT(CASE WHEN pe.status = 'active' THEN 1 END) as active_events,
    SUM(pe.views_count) as total_views,
    SUM(pe.votes_count) as total_votes,
    AVG(pe.votes_count) as avg_votes_per_event
FROM partners p
LEFT JOIN partner_events pe ON p.id = pe.partner_id
GROUP BY p.id, p.company_name, p.tier, p.status;

CREATE OR REPLACE VIEW top_partner_events AS
SELECT 
    pe.id,
    pe.name,
    p.company_name,
    pe.category,
    pe.views_count,
    pe.votes_count,
    pe.likes_count,
    ROUND(pe.likes_count::numeric / NULLIF(pe.votes_count, 0), 2) as like_ratio
FROM partner_events pe
JOIN partners p ON pe.partner_id = p.id
WHERE pe.status = 'active' AND pe.votes_count > 0
ORDER BY pe.votes_count DESC, like_ratio DESC;

-- 17. Add comments for documentation
COMMENT ON TABLE partners IS 'Partner companies that can add events to the platform';
COMMENT ON TABLE partner_events IS 'Events created by partner companies';
COMMENT ON TABLE partner_analytics IS 'Analytics data for partner events';
COMMENT ON TABLE partner_event_votes IS 'Individual votes on partner events';
COMMENT ON TABLE partner_event_views IS 'View tracking for partner events';
COMMENT ON VIEW partner_dashboard IS 'Dashboard view for partner analytics';
COMMENT ON VIEW top_partner_events IS 'Top performing partner events'; 