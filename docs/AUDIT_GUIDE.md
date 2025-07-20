# Audit Information Guide for Choosy

## Industry Best Practices for Data Storage

### Modern Platform Architecture
1. **Aggregated Counters** - Store vote counts, not individual vote records
2. **Recent Activity Only** - Keep detailed records for 30-90 days, then aggregate
3. **Tiered Storage** - Hot data (recent) in fast DB, cold data (old) in data warehouses
4. **Event Sourcing** - Store events as immutable logs, build current state from events

## Essential Audit Information (Keep These)

### 1. Individual Votes (30-day retention)
**Why:** Fraud detection, vote manipulation prevention
**What to store:**
- Vote ID, plan ID, event ID, voter ID, vote type
- Created timestamp, updated timestamp
- IP address (for fraud detection)

### 2. Voter Participation Tracking
**Why:** Engagement metrics, user behavior analysis
**What to store:**
- Voter ID, plan ID, events voted on count
- First vote timestamp, last vote timestamp
- Participation rate per plan

### 3. Plan Metadata
**Why:** Accountability, user tracking
**What to store:**
- Plan creator (name, phone)
- Plan creation timestamp
- Topic, group size, location
- Custom events added

### 4. Event Sources
**Why:** Data provenance, API attribution
**What to store:**
- Source type (mock, API, custom)
- API provider (if applicable)
- Event metadata (venue, price, etc.)

## Optional Audit Information (Archive After 30 Days)

### 1. Detailed Vote History
**Why:** Historical analysis, debugging
**What to archive:**
- Individual vote records older than 30 days
- Vote change history
- Detailed user interaction logs

### 2. Event Details
**Why:** Storage optimization
**What to archive:**
- High-resolution images
- Detailed descriptions
- Historical pricing data

### 3. User Session Data
**Why:** Privacy compliance
**What to archive:**
- IP addresses older than 90 days
- Session tokens
- Device information

## Database Optimization Strategy

### Current Implementation
```sql
-- Keep for 30 days (essential)
votes (id, plan_id, event_id, voter_id, vote_type, created_at, updated_at)

-- Keep aggregated counts (performance)
events (id, name, votes_count, last_vote_at, vote_history_count)

-- Keep participation tracking (engagement)
voter_participation (plan_id, voter_id, events_voted_on, first_vote_at, last_vote_at)

-- Archive after 30 days (optional)
audit_log (table_name, record_id, action, old_values, new_values, created_at)
```

### Cleanup Schedule
- **Daily:** Archive votes older than 30 days to audit_log
- **Weekly:** Aggregate vote counts, update participation metrics
- **Monthly:** Clean up old audit logs (keep for 1 year)

## What You DON'T Need to Store

### 1. Every User Interaction
- Page views, button clicks, scroll events
- Real-time user behavior tracking
- Session replay data

### 2. Historical Vote Changes
- Every vote modification after 30 days
- Vote change reasons
- User intent data

### 3. Detailed User Profiles
- Personal preferences beyond voting
- Social connections
- Location history

## Compliance Requirements

### GDPR/Privacy
- **Right to be forgotten:** Delete user data on request
- **Data minimization:** Only store what's necessary
- **Retention limits:** Clear data retention policies

### Legal/Regulatory
- **Fraud prevention:** Keep vote records for investigation
- **Dispute resolution:** Maintain plan and vote integrity
- **Tax purposes:** Keep transaction records if monetizing

## Production Recommendations

### 1. Data Retention Policy
```
Votes: 30 days (essential audit)
Voter participation: 1 year (engagement metrics)
Plan metadata: 2 years (user accountability)
Audit logs: 7 years (compliance)
```

### 2. Storage Optimization
- Use PostgreSQL partitioning for large tables
- Implement data archiving to cloud storage
- Use read replicas for analytics queries

### 3. Monitoring
- Track vote patterns for fraud detection
- Monitor database growth and performance
- Alert on unusual activity patterns

## Example Audit Queries

### Fraud Detection
```sql
-- Detect multiple votes from same IP
SELECT ip_address, COUNT(*) as vote_count
FROM votes 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address 
HAVING COUNT(*) > 10;

-- Detect vote manipulation
SELECT voter_id, COUNT(*) as vote_changes
FROM votes 
WHERE updated_at > created_at
GROUP BY voter_id 
HAVING COUNT(*) > 5;
```

### Engagement Analytics
```sql
-- User participation rates
SELECT 
    plan_id,
    COUNT(DISTINCT voter_id) as active_voters,
    AVG(events_voted_on) as avg_engagement
FROM voter_participation
GROUP BY plan_id;

-- Event popularity trends
SELECT 
    event_id,
    name,
    votes_count,
    last_vote_at
FROM events 
ORDER BY votes_count DESC;
```

## Summary

**Keep for 30 days:**
- Individual votes (fraud detection)
- Vote changes (integrity)
- User participation (engagement)

**Keep aggregated:**
- Vote counts (performance)
- Participation metrics (analytics)
- Plan metadata (accountability)

**Archive after 30 days:**
- Detailed vote history
- Session data
- Old audit logs

This approach gives you the audit trail you need while keeping your database fast and scalable, following industry best practices! 