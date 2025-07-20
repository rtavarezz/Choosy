-- MVP Database Optimizations for 100+ Users
-- This migration adds performance optimizations and safety features

-- 1. Add rate limiting table to prevent abuse
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- phone number or IP
    endpoint TEXT NOT NULL, -- API endpoint
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- 2. Add indexes for common queries (performance)
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at);
CREATE INDEX IF NOT EXISTS idx_plans_expires_at ON plans(expires_at);
CREATE INDEX IF NOT EXISTS idx_events_votes_count ON events(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_created_at_voter ON votes(created_at, voter_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- 3. Add constraints for data integrity
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_expires_future') THEN
        ALTER TABLE plans ADD CONSTRAINT check_expires_future 
            CHECK (expires_at > created_at);
    END IF;
END $$;

-- Note: Cannot use subquery in CHECK constraint, will handle this in application logic
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_vote_plan_active') THEN
--         ALTER TABLE votes ADD CONSTRAINT check_vote_plan_active
--             CHECK (plan_id IN (SELECT id FROM plans WHERE is_active = true));
--     END IF;
-- END $$;

-- 4. Add cleanup function for expired plans
CREATE OR REPLACE FUNCTION cleanup_expired_plans()
RETURNS void AS $$
BEGIN
    -- Archive votes from expired plans to audit_log
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, created_at)
    SELECT 
        'votes',
        v.id,
        'ARCHIVE',
        jsonb_build_object(
            'plan_id', v.plan_id,
            'event_id', v.event_id,
            'voter_id', v.voter_id,
            'vote_type', v.vote_type
        ),
        NULL,
        NOW()
    FROM votes v
    JOIN plans p ON v.plan_id = p.id
    WHERE p.expires_at < NOW() - INTERVAL '1 day'
    AND v.created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old votes (keep for 30 days)
    DELETE FROM votes 
    WHERE plan_id IN (
        SELECT id FROM plans WHERE expires_at < NOW() - INTERVAL '30 days'
    );
    
    -- Mark expired plans as inactive
    UPDATE plans 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Clean up old rate limit records (keep for 1 hour)
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 5. Create a scheduled job (if using pg_cron extension)
-- Uncomment if you have pg_cron installed:
-- SELECT cron.schedule('cleanup-expired-plans', '0 2 * * *', 'SELECT cleanup_expired_plans();');

-- 6. Add monitoring views for MVP
CREATE OR REPLACE VIEW active_plans_summary AS
SELECT 
    COUNT(*) as total_active_plans,
    COUNT(CASE WHEN expires_at < NOW() + INTERVAL '5 minutes' THEN 1 END) as expiring_soon,
    AVG(EXTRACT(EPOCH FROM (expires_at - created_at))/60) as avg_plan_duration_minutes
FROM plans 
WHERE is_active = true;

CREATE OR REPLACE VIEW voting_activity AS
SELECT 
    DATE(created_at) as vote_date,
    COUNT(*) as total_votes,
    COUNT(DISTINCT voter_id) as unique_voters,
    COUNT(DISTINCT plan_id) as active_plans
FROM votes 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY vote_date DESC;

-- 7. Add comments for documentation
COMMENT ON TABLE rate_limits IS 'Rate limiting table to prevent API abuse';
COMMENT ON FUNCTION cleanup_expired_plans() IS 'Cleanup function to archive old data and maintain performance';
COMMENT ON VIEW active_plans_summary IS 'Summary view for monitoring active plans';
COMMENT ON VIEW voting_activity IS 'Voting activity view for engagement metrics'; 