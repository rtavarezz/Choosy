-- Create missing tables and add RLS policies
-- This ensures all tables exist before adding security policies

-- 1. Create user_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL, -- Use phone as identifier (simpler than UUID)
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'voter')), -- User's role in the plan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_phone, plan_id) -- Prevent duplicate entries
);

-- 2. Create voter_participation table if it doesn't exist
CREATE TABLE IF NOT EXISTS voter_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL CHECK (length(voter_id) >= 10),
  events_voted_on INTEGER DEFAULT 0 CHECK (events_voted_on >= 0),
  completed_voting BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, voter_id)
);

-- 3. Create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- phone number or IP
    endpoint TEXT NOT NULL, -- API endpoint
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_plans_user_phone ON user_plans(user_phone);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON user_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_voter_participation_plan_id ON voter_participation(plan_id);
CREATE INDEX IF NOT EXISTS idx_voter_participation_voter_id ON voter_participation(voter_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- 6. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policies for user_plans
DROP POLICY IF EXISTS "Users can view own plan participation" ON user_plans;
CREATE POLICY "Users can view own plan participation" ON user_plans
  FOR SELECT USING (user_phone = auth.jwt() ->> 'phone');

DROP POLICY IF EXISTS "Users can create own plan participation" ON user_plans;
CREATE POLICY "Users can create own plan participation" ON user_plans
  FOR INSERT WITH CHECK (user_phone = auth.jwt() ->> 'phone');

DROP POLICY IF EXISTS "Users can update own plan participation" ON user_plans;
CREATE POLICY "Users can update own plan participation" ON user_plans
  FOR UPDATE USING (user_phone = auth.jwt() ->> 'phone');

DROP POLICY IF EXISTS "Host can view plan participants" ON user_plans;
CREATE POLICY "Host can view plan participants" ON user_plans
  FOR SELECT USING (
    plan_id IN (
      SELECT id FROM plans WHERE host_phone = auth.jwt() ->> 'phone'
    )
  );

-- 8. Add RLS policies for voter_participation
DROP POLICY IF EXISTS "Users can view own participation" ON voter_participation;
CREATE POLICY "Users can view own participation" ON voter_participation
  FOR SELECT USING (voter_id = auth.jwt() ->> 'phone');

DROP POLICY IF EXISTS "Users can create own participation" ON voter_participation;
CREATE POLICY "Users can create own participation" ON voter_participation
  FOR INSERT WITH CHECK (voter_id = auth.jwt() ->> 'phone');

DROP POLICY IF EXISTS "Users can update own participation" ON voter_participation;
CREATE POLICY "Users can update own participation" ON voter_participation
  FOR UPDATE USING (voter_id = auth.jwt() ->> 'phone');

DROP POLICY IF EXISTS "Host can view plan participation" ON voter_participation;
CREATE POLICY "Host can view plan participation" ON voter_participation
  FOR SELECT USING (
    plan_id IN (
      SELECT id FROM plans WHERE host_phone = auth.jwt() ->> 'phone'
    )
  );

-- 9. Add RLS policies for audit_log (read-only)
DROP POLICY IF EXISTS "Read-only audit log access" ON audit_log;
CREATE POLICY "Read-only audit log access" ON audit_log
  FOR SELECT USING (true);

-- 10. Add RLS policies for rate_limits (system table)
DROP POLICY IF EXISTS "Read rate limits for monitoring" ON rate_limits;
CREATE POLICY "Read rate limits for monitoring" ON rate_limits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert rate limits" ON rate_limits;
CREATE POLICY "System can insert rate limits" ON rate_limits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update rate limits" ON rate_limits;
CREATE POLICY "System can update rate limits" ON rate_limits
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "System can delete old rate limits" ON rate_limits;
CREATE POLICY "System can delete old rate limits" ON rate_limits
  FOR DELETE USING (window_start < NOW() - INTERVAL '1 hour');

-- 11. Add update trigger for voter_participation
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_voter_participation_updated_at ON voter_participation;
CREATE TRIGGER update_voter_participation_updated_at BEFORE UPDATE ON voter_participation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 