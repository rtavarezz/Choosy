-- Row Level Security (RLS) Policies for Choosy
-- These policies control who can access what data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can create their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (phone = auth.jwt() ->> 'phone');

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (phone = auth.jwt() ->> 'phone');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (phone = auth.jwt() ->> 'phone');

-- Plans table policies
-- Anyone can view active plans (for voting)
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (is_active = true);

-- Host can create their own plans
CREATE POLICY "Host can create own plans" ON plans
  FOR INSERT WITH CHECK (host_phone = auth.jwt() ->> 'phone');

-- Host can view and update their own plans
CREATE POLICY "Host can manage own plans" ON plans
  FOR ALL USING (host_phone = auth.jwt() ->> 'phone');

-- Events table policies
-- Anyone can view events for active plans
CREATE POLICY "Anyone can view events for active plans" ON events
  FOR SELECT USING (
    plan_id IN (
      SELECT id FROM plans WHERE is_active = true
    )
  );

-- Host can manage events for their plans
CREATE POLICY "Host can manage events for own plans" ON events
  FOR ALL USING (
    plan_id IN (
      SELECT id FROM plans WHERE host_phone = auth.jwt() ->> 'phone'
    )
  );

-- Votes table policies
-- Anyone can view votes for active plans
CREATE POLICY "Anyone can view votes for active plans" ON votes
  FOR SELECT USING (
    plan_id IN (
      SELECT id FROM plans WHERE is_active = true
    )
  );

-- Users can only vote once per event per plan
CREATE POLICY "Users can vote once per event" ON votes
  FOR INSERT WITH CHECK (
    plan_id IN (
      SELECT id FROM plans WHERE is_active = true
    )
  );

-- Users can update their own votes (for vote changing)
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (voter_id = auth.jwt() ->> 'phone');

-- Custom events table policies
-- Anyone can view custom events for active plans
CREATE POLICY "Anyone can view custom events for active plans" ON custom_events
  FOR SELECT USING (
    plan_id IN (
      SELECT id FROM plans WHERE is_active = true
    )
  );

-- Users can create custom events for any active plan
CREATE POLICY "Users can create custom events" ON custom_events
  FOR INSERT WITH CHECK (
    plan_id IN (
      SELECT id FROM plans WHERE is_active = true
    )
  );

-- Creator can update their custom events
CREATE POLICY "Creator can update own custom events" ON custom_events
  FOR UPDATE USING (created_by = auth.jwt() ->> 'phone'); 