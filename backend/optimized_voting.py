"""
Optimized Voting System for Choosy
Balances performance with audit requirements

Strategy:
1. Keep individual votes for 30 days (fraud detection)
2. Aggregate vote counts in events table
3. Track voter participation for engagement
4. Archive old votes to data warehouse
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

class OptimizedVotingSystem:
    """Optimized voting system that balances performance with audit needs"""
    
    def __init__(self):
        self.vote_retention_days = 30  # Keep individual votes for 30 days
        self.aggregation_threshold = 100  # Aggregate after 100 votes per event
    
    def record_vote(self, plan_id: str, event_id: str, voter_id: str, vote_type: str):
        """Record a vote with optimized storage"""
        try:
            with engine.connect() as conn:
                with conn.begin():
                    # Check for existing vote
                    existing_vote = conn.execute(
                        text("""
                            SELECT vote_type, created_at 
                            FROM votes 
                            WHERE plan_id = :plan_id AND event_id = :event_id AND voter_id = :voter_id
                        """),
                        {"plan_id": plan_id, "event_id": event_id, "voter_id": voter_id}
                    ).fetchone()
                    
                    if existing_vote:
                        # Update existing vote
                        old_vote_type = existing_vote[0]
                        vote_age = datetime.now() - existing_vote[1]
                        
                        # If vote is old, we might want to treat it as new for audit purposes
                        if vote_age.days > self.vote_retention_days:
                            # Archive old vote and create new one
                            self._archive_vote(conn, plan_id, event_id, voter_id, old_vote_type)
                            self._create_new_vote(conn, plan_id, event_id, voter_id, vote_type)
                        else:
                            # Update existing vote
                            conn.execute(
                                text("""
                                    UPDATE votes 
                                    SET vote_type = :vote_type, updated_at = NOW()
                                    WHERE plan_id = :plan_id AND event_id = :event_id AND voter_id = :voter_id
                                """),
                                {
                                    "vote_type": vote_type,
                                    "plan_id": plan_id,
                                    "event_id": event_id,
                                    "voter_id": voter_id
                                }
                            )
                        
                        # Update aggregated counts
                        self._update_vote_counts(conn, event_id, old_vote_type, vote_type)
                    else:
                        # Create new vote
                        self._create_new_vote(conn, plan_id, event_id, voter_id, vote_type)
                        if vote_type == 'like':
                            self._update_vote_counts(conn, event_id, None, 'like')
                    
                    # Update voter participation
                    self._update_voter_participation(conn, plan_id, voter_id)
                    
            return {"success": True, "message": "Vote recorded"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def _create_new_vote(self, conn, plan_id: str, event_id: str, voter_id: str, vote_type: str):
        """Create a new vote record"""
        vote_id = str(uuid.uuid4())
        conn.execute(
            text("""
                INSERT INTO votes (id, plan_id, event_id, voter_id, vote_type, created_at)
                VALUES (:id, :plan_id, :event_id, :voter_id, :vote_type, NOW())
            """),
            {
                "id": vote_id,
                "plan_id": plan_id,
                "event_id": event_id,
                "voter_id": voter_id,
                "vote_type": vote_type
            }
        )
    
    def _update_vote_counts(self, conn, event_id: str, old_vote_type: str, new_vote_type: str):
        """Update aggregated vote counts in events table"""
        if old_vote_type == 'like' and new_vote_type == 'dislike':
            conn.execute(
                text("UPDATE events SET votes_count = votes_count - 1 WHERE id = :event_id"),
                {"event_id": event_id}
            )
        elif old_vote_type == 'dislike' and new_vote_type == 'like':
            conn.execute(
                text("UPDATE events SET votes_count = votes_count + 1 WHERE id = :event_id"),
                {"event_id": event_id}
            )
        elif old_vote_type is None and new_vote_type == 'like':
            conn.execute(
                text("UPDATE events SET votes_count = votes_count + 1 WHERE id = :event_id"),
                {"event_id": event_id}
            )
    
    def _update_voter_participation(self, conn, plan_id: str, voter_id: str):
        """Update voter participation tracking"""
        conn.execute(
            text("""
                INSERT INTO voter_participation (id, plan_id, voter_id, events_voted_on)
                VALUES (:id, :plan_id, :voter_id, 1)
                ON CONFLICT (plan_id, voter_id) 
                DO UPDATE SET 
                    events_voted_on = voter_participation.events_voted_on + 1,
                    updated_at = NOW()
            """),
            {
                "id": str(uuid.uuid4()),
                "plan_id": plan_id,
                "voter_id": voter_id
            }
        )
    
    def _archive_vote(self, conn, plan_id: str, event_id: str, voter_id: str, vote_type: str):
        """Archive old vote to audit log (simplified - in production would use separate table)"""
        # In production, you'd move this to an audit_log table
        # For now, we'll just delete old votes after 30 days
        conn.execute(
            text("""
                DELETE FROM votes 
                WHERE plan_id = :plan_id AND event_id = :event_id AND voter_id = :voter_id
                AND created_at < NOW() - INTERVAL '30 days'
            """),
            {"plan_id": plan_id, "event_id": event_id, "voter_id": voter_id}
        )
    
    def get_vote_analytics(self, plan_id: str):
        """Get voting analytics for a plan"""
        try:
            with engine.connect() as conn:
                # Get vote counts per event
                vote_counts = conn.execute(
                    text("""
                        SELECT e.id, e.name, e.votes_count, 
                               COUNT(v.id) as total_votes,
                               COUNT(CASE WHEN v.vote_type = 'like' THEN 1 END) as likes,
                               COUNT(CASE WHEN v.vote_type = 'dislike' THEN 1 END) as dislikes
                        FROM events e
                        LEFT JOIN votes v ON e.id = v.event_id
                        WHERE e.plan_id = :plan_id
                        GROUP BY e.id, e.name, e.votes_count
                        ORDER BY e.votes_count DESC
                    """),
                    {"plan_id": plan_id}
                ).fetchall()
                
                # Get voter participation
                participation = conn.execute(
                    text("""
                        SELECT voter_id, events_voted_on, created_at, updated_at
                        FROM voter_participation
                        WHERE plan_id = :plan_id
                        ORDER BY events_voted_on DESC
                    """),
                    {"plan_id": plan_id}
                ).fetchall()
                
                return {
                    "vote_counts": [
                        {
                            "event_id": row[0],
                            "event_name": row[1],
                            "aggregated_count": row[2],
                            "total_votes": row[3],
                            "likes": row[4],
                            "dislikes": row[5]
                        }
                        for row in vote_counts
                    ],
                    "participation": [
                        {
                            "voter_id": row[0],
                            "events_voted_on": row[1],
                            "first_vote": row[2],
                            "last_vote": row[3]
                        }
                        for row in participation
                    ]
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def cleanup_old_votes(self):
        """Clean up votes older than retention period"""
        try:
            with engine.connect() as conn:
                deleted_count = conn.execute(
                    text("""
                        DELETE FROM votes 
                        WHERE created_at < NOW() - INTERVAL ':days days'
                    """),
                    {"days": self.vote_retention_days}
                ).rowcount
                
                conn.commit()
                return {"deleted_votes": deleted_count}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Usage example:
# voting_system = OptimizedVotingSystem()
# voting_system.record_vote(plan_id, event_id, voter_id, "like") 