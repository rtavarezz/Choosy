-- Add voter_participation table for optimized voting
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
CREATE INDEX IF NOT EXISTS idx_voter_participation_plan_id ON voter_participation(plan_id);
CREATE INDEX IF NOT EXISTS idx_voter_participation_voter_id ON voter_participation(voter_id);

-- Update trigger
CREATE TRIGGER update_voter_participation_updated_at BEFORE UPDATE ON voter_participation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 