-- Optimized Voting Schema for Choosy
-- This reduces database bloat while maintaining functionality

-- Option 1: Vote Counts Only (Simplest)
-- Just update the events.votes_count field directly
-- No individual vote storage needed

-- Option 2: Aggregated Vote Storage (Recommended)
CREATE TABLE IF NOT EXISTS vote_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  dislikes_count INTEGER DEFAULT 0 CHECK (dislikes_count >= 0),
  total_voters INTEGER DEFAULT 0 CHECK (total_voters >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, event_id)
);

-- Option 3: User Participation Tracking (Lightweight)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vote_summaries_plan_id ON vote_summaries(plan_id);
CREATE INDEX IF NOT EXISTS idx_vote_summaries_event_id ON vote_summaries(event_id);
CREATE INDEX IF NOT EXISTS idx_voter_participation_plan_id ON voter_participation(plan_id);
CREATE INDEX IF NOT EXISTS idx_voter_participation_voter_id ON voter_participation(voter_id);

-- Update trigger for vote_summaries
CREATE TRIGGER update_vote_summaries_updated_at BEFORE UPDATE ON vote_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for voter_participation  
CREATE TRIGGER update_voter_participation_updated_at BEFORE UPDATE ON voter_participation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 