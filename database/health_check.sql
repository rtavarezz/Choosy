-- MVP Database Health Check
-- Run this to monitor your database health for 100+ users

-- 1. Check active plans and usage
SELECT 
    'Active Plans' as metric,
    COUNT(*) as value,
    'Total active plans right now' as description
FROM plans 
WHERE is_active = true

UNION ALL

SELECT 
    'Expiring Soon' as metric,
    COUNT(*) as value,
    'Plans expiring in next 5 minutes' as description
FROM plans 
WHERE is_active = true AND expires_at < NOW() + INTERVAL '5 minutes'

UNION ALL

SELECT 
    'Recent Votes' as metric,
    COUNT(*) as value,
    'Votes in last 24 hours' as description
FROM votes 
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Active Voters' as metric,
    COUNT(DISTINCT voter_id) as value,
    'Unique voters in last 24 hours' as description
FROM votes 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 2. Check database performance
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('plans', 'votes', 'events', 'users')
ORDER BY tablename, attname;

-- 3. Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- 4. Check for potential issues
SELECT 
    'Plans without events' as issue,
    COUNT(*) as count
FROM plans p
LEFT JOIN events e ON p.id = e.plan_id
WHERE p.is_active = true AND e.id IS NULL

UNION ALL

SELECT 
    'Events without votes' as issue,
    COUNT(*) as count
FROM events e
LEFT JOIN votes v ON e.id = v.event_id
WHERE e.plan_id IN (SELECT id FROM plans WHERE is_active = true)
AND v.id IS NULL;

-- 5. Rate limiting check
SELECT 
    identifier,
    endpoint,
    SUM(request_count) as total_requests,
    COUNT(*) as time_windows
FROM rate_limits 
WHERE window_start > NOW() - INTERVAL '1 hour'
GROUP BY identifier, endpoint
HAVING SUM(request_count) > 50
ORDER BY total_requests DESC; 