-- Add audit fields for optimized voting system
-- This migration adds fields needed for audit trails while keeping performance optimized

-- Add updated_at to votes table for tracking vote changes
ALTER TABLE votes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add audit fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_vote_at TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vote_history_count INTEGER DEFAULT 0;

-- Add audit fields to voter_participation table
ALTER TABLE voter_participation ADD COLUMN IF NOT EXISTS first_vote_at TIMESTAMP DEFAULT NOW();
ALTER TABLE voter_participation ADD COLUMN IF NOT EXISTS last_vote_at TIMESTAMP DEFAULT NOW();

-- Create audit_log table for long-term storage (optional - for production)
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

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_updated_at ON votes(updated_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Add comments for documentation
COMMENT ON TABLE audit_log IS 'Long-term audit trail for compliance and debugging';
COMMENT ON COLUMN votes.updated_at IS 'When vote was last modified';
COMMENT ON COLUMN events.last_vote_at IS 'When this event was last voted on';
COMMENT ON COLUMN events.vote_history_count IS 'Total number of votes this event has received (including deleted ones)';
COMMENT ON COLUMN voter_participation.first_vote_at IS 'When this voter first participated';
COMMENT ON COLUMN voter_participation.last_vote_at IS 'When this voter last participated'; 