"""
Event Optimization System for Choosy
Handles 50+ events efficiently without limiting user choices

Strategy:
1. Deduplicate events across plans (same venue/activity)
2. Cache popular events for fast retrieval
3. Archive unused events after 90 days
4. Use event templates for common activities
5. Smart event ranking based on popularity
"""

from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

class EventOptimizationSystem:
    """Optimizes event storage for 50+ events without limiting choices"""
    
    def __init__(self):
        self.event_retention_days = 90  # Archive unused events after 90 days
        self.cache_popular_events = True  # Cache frequently used events
    
    def deduplicate_events(self, events: list):
        """Remove duplicate events based on venue and activity"""
        seen = set()
        unique_events = []
        
        for event in events:
            event_key = self._create_event_key(event)
            
            if event_key not in seen:
                seen.add(event_key)
                unique_events.append(event)
        
        return unique_events
    
    def _create_event_key(self, event: dict):
        """Create unique key for event deduplication"""
        name = event.get('name', '').lower().strip()
        venue = event.get('metadata', {}).get('venue', '').lower().strip()
        # Include more fields for better deduplication
        price = event.get('metadata', {}).get('price', '').lower().strip()
        return f"{name}:{venue}:{price}"
    
    def find_existing_events(self, new_events: list):
        """Find existing events that match new events (for deduplication)"""
        try:
            with engine.connect() as conn:
                existing_events = []
                
                for event in new_events:
                    event_key = self._create_event_key(event)
                    name, venue, price = event_key.split(':')
                    
                    # Find similar events in database
                    result = conn.execute(
                        text("""
                            SELECT id, name, metadata, votes_count, last_vote_at
                            FROM events 
                            WHERE LOWER(name) LIKE :name_pattern
                            AND metadata->>'venue' ILIKE :venue_pattern
                            AND source_type != 'custom'
                        """),
                        {
                            "name_pattern": f"%{name}%",
                            "venue_pattern": f"%{venue}%"
                        }
                    ).fetchall()
                    
                    if result:
                        existing_events.extend(result)
                
                return existing_events
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def cache_popular_events(self):
        """Cache frequently used events for fast retrieval"""
        try:
            with engine.connect() as conn:
                # Find popular events (high vote counts or recent activity)
                popular_events = conn.execute(
                    text("""
                        SELECT id, name, metadata, votes_count, last_vote_at, source_type
                        FROM events 
                        WHERE (votes_count > 5 OR last_vote_at > NOW() - INTERVAL '7 days')
                        AND source_type != 'custom'
                        ORDER BY votes_count DESC, last_vote_at DESC
                        LIMIT 100
                    """)
                ).fetchall()
                
                # Store in audit_log as cached events
                for event in popular_events:
                    conn.execute(
                        text("""
                            INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, created_at)
                            VALUES ('cached_events', :event_id, 'CACHE', 
                                   NULL,
                                   jsonb_build_object('name', :name, 'votes_count', :votes_count, 'last_vote_at', :last_vote_at),
                                   NOW())
                            ON CONFLICT (table_name, record_id) DO NOTHING
                        """),
                        {
                            "event_id": event[0],
                            "name": event[1],
                            "votes_count": event[3],
                            "last_vote_at": event[4]
                        }
                    )
                
                conn.commit()
                return {"cached_events": len(popular_events)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def archive_unused_events(self):
        """Archive events that haven't been used in 90 days"""
        try:
            with engine.connect() as conn:
                # Find unused events (no votes, old, not custom)
                unused_events = conn.execute(
                    text("""
                        SELECT e.id, e.name, e.created_at
                        FROM events e
                        LEFT JOIN votes v ON e.id = v.event_id
                        WHERE e.created_at < NOW() - INTERVAL ':days days'
                        AND v.id IS NULL
                        AND e.source_type != 'custom'
                        AND e.source_type != 'api'
                    """),
                    {"days": self.event_retention_days}
                ).fetchall()
                
                # Archive to audit_log
                archived_count = 0
                for event in unused_events:
                    conn.execute(
                        text("""
                            INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, created_at)
                            VALUES ('events', :event_id, 'ARCHIVE', 
                                   jsonb_build_object('id', :event_id, 'name', :name, 'created_at', :created_at),
                                   NULL, NOW())
                        """),
                        {
                            "event_id": event[0],
                            "name": event[1], 
                            "created_at": event[2]
                        }
                    )
                    archived_count += 1
                
                # Delete unused events
                deleted_count = conn.execute(
                    text("""
                        DELETE FROM events 
                        WHERE created_at < NOW() - INTERVAL ':days days'
                        AND id NOT IN (SELECT DISTINCT event_id FROM votes)
                        AND source_type != 'custom'
                        AND source_type != 'api'
                    """),
                    {"days": self.event_retention_days}
                ).rowcount
                
                conn.commit()
                return {
                    "archived_events": archived_count,
                    "deleted_events": deleted_count
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_event_statistics(self):
        """Get comprehensive event storage statistics"""
        try:
            with engine.connect() as conn:
                # Total events by source
                events_by_source = conn.execute(
                    text("""
                        SELECT source_type, COUNT(*) as count
                        FROM events
                        GROUP BY source_type
                    """)
                ).fetchall()
                
                # Events by usage
                events_by_usage = conn.execute(
                    text("""
                        SELECT 
                            CASE 
                                WHEN v.id IS NOT NULL THEN 'used'
                                ELSE 'unused'
                            END as usage_status,
                            COUNT(*) as count
                        FROM events e
                        LEFT JOIN votes v ON e.id = v.event_id
                        GROUP BY usage_status
                    """)
                ).fetchall()
                
                # Popular events (high vote counts)
                popular_events = conn.execute(
                    text("""
                        SELECT COUNT(*) 
                        FROM events 
                        WHERE votes_count > 5
                    """)
                ).scalar()
                
                # Recent events (last 7 days)
                recent_events = conn.execute(
                    text("""
                        SELECT COUNT(*) 
                        FROM events 
                        WHERE created_at > NOW() - INTERVAL '7 days'
                    """)
                ).scalar()
                
                return {
                    "events_by_source": [
                        {"source": row[0], "count": row[1]} 
                        for row in events_by_source
                    ],
                    "events_by_usage": [
                        {"status": row[0], "count": row[1]} 
                        for row in events_by_usage
                    ],
                    "popular_events": popular_events,
                    "recent_events": recent_events
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def optimize_event_storage(self):
        """Run all optimization tasks"""
        try:
            results = {}
            
            # Cache popular events
            if self.cache_popular_events:
                results["caching"] = self.cache_popular_events()
            
            # Archive unused events
            results["archiving"] = self.archive_unused_events()
            
            # Get statistics
            results["statistics"] = self.get_event_statistics()
            
            return results
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Usage example:
# optimizer = EventOptimizationSystem()
# unique_events = optimizer.deduplicate_events(events)
# optimizer.optimize_event_storage() 