-- Add RLS policies for tables that are missing them
-- This ensures all user data is properly secured

-- Enable RLS on missing tables
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- User Plans table policies
-- Users can view their own plan participation
CREATE POLICY "Users can view own plan participation" ON user_plans
  FOR SELECT USING (user_phone = auth.jwt() ->> 'phone');

-- Users can create their own plan participation
CREATE POLICY "Users can create own plan participation" ON user_plans
  FOR INSERT WITH CHECK (user_phone = auth.jwt() ->> 'phone');

-- Users can update their own plan participation
CREATE POLICY "Users can update own plan participation" ON user_plans
  FOR UPDATE USING (user_phone = auth.jwt() ->> 'phone');

-- Host can view all participants in their plans
CREATE POLICY "Host can view plan participants" ON user_plans
  FOR SELECT USING (
    plan_id IN (
      SELECT id FROM plans WHERE host_phone = auth.jwt() ->> 'phone'
    )
  );

-- Voter Participation table policies
-- Users can view their own participation records
CREATE POLICY "Users can view own participation" ON voter_participation
  FOR SELECT USING (voter_id = auth.jwt() ->> 'phone');

-- Users can create their own participation records
CREATE POLICY "Users can create own participation" ON voter_participation
  FOR INSERT WITH CHECK (voter_id = auth.jwt() ->> 'phone');

-- Users can update their own participation records
CREATE POLICY "Users can update own participation" ON voter_participation
  FOR UPDATE USING (voter_id = auth.jwt() ->> 'phone');

-- Host can view participation for their plans
CREATE POLICY "Host can view plan participation" ON voter_participation
  FOR SELECT USING (
    plan_id IN (
      SELECT id FROM plans WHERE host_phone = auth.jwt() ->> 'phone'
    )
  );

-- Audit Log table policies (restricted access)
-- Only allow read access for security monitoring
CREATE POLICY "Read-only audit log access" ON audit_log
  FOR SELECT USING (true); -- Allow reading for monitoring

-- No INSERT/UPDATE/DELETE policies for audit_log (system-only)

-- Rate Limits table policies (system table)
-- Allow read access for monitoring
CREATE POLICY "Read rate limits for monitoring" ON rate_limits
  FOR SELECT USING (true);

-- Allow system to insert rate limit records
CREATE POLICY "System can insert rate limits" ON rate_limits
  FOR INSERT WITH CHECK (true);

-- Allow system to update rate limit records
CREATE POLICY "System can update rate limits" ON rate_limits
  FOR UPDATE USING (true);

-- Allow cleanup of old rate limit records
CREATE POLICY "System can delete old rate limits" ON rate_limits
  FOR DELETE USING (window_start < NOW() - INTERVAL '1 hour'); 