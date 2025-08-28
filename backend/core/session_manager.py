"""
Redis-based Session Manager for Active Voters
Handles real-time voter tracking and session management
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from core.cache_manager import cache_manager

logger = logging.getLogger(__name__)

class ActiveVoterManager:
    """Manages active voter sessions using Redis for real-time tracking"""
    
    def __init__(self):
        self.cache = cache_manager
        self.session_timeout = 300  # 5 minutes
    
    def _get_plan_key(self, plan_id: str) -> str:
        """Get Redis key for plan active voters"""
        return f"active_voters:{plan_id}"
    
    def _get_voter_key(self, plan_id: str, voter_id: str) -> str:
        """Get Redis key for individual voter"""
        return f"active_voters:{plan_id}:{voter_id}"
    
    def join_plan(self, plan_id: str, voter_id: str, name: str) -> Dict[str, Any]:
        """Add voter to active voters list for a plan"""
        try:
            now = datetime.utcnow().isoformat()
            voter_data = {
                "name": name,
                "joined_at": now,
                "last_activity": now
            }
            
            # Set individual voter data with TTL
            voter_key = self._get_voter_key(plan_id, voter_id)
            self.cache.set(voter_key, voter_data, ttl=self.session_timeout)
            
            # Add voter to plan's active list
            plan_key = self._get_plan_key(plan_id)
            active_voters = self.cache.get(plan_key) or {}
            active_voters[voter_id] = voter_data
            self.cache.set(plan_key, active_voters, ttl=self.session_timeout)
            
            logger.info(f"Voter {voter_id} ({name}) joined plan {plan_id}")
            return {
                "plan_id": plan_id,
                "active_count": len(active_voters),
                "active_ids": list(active_voters.keys())
            }
            
        except Exception as e:
            logger.error(f"Error adding voter to plan {plan_id}: {e}")
            # Fallback to in-memory if Redis fails
            return self._fallback_join(plan_id, voter_id, name)
    
    def leave_plan(self, plan_id: str, voter_id: str) -> Dict[str, Any]:
        """Remove voter from active voters list for a plan"""
        try:
            # Remove individual voter data
            voter_key = self._get_voter_key(plan_id, voter_id)
            self.cache.delete(voter_key)
            
            # Remove voter from plan's active list
            plan_key = self._get_plan_key(plan_id)
            active_voters = self.cache.get(plan_key) or {}
            active_voters.pop(voter_id, None)
            
            if active_voters:
                self.cache.set(plan_key, active_voters, ttl=self.session_timeout)
            else:
                self.cache.delete(plan_key)
            
            logger.info(f"Voter {voter_id} left plan {plan_id}")
            return {
                "plan_id": plan_id,
                "active_count": len(active_voters),
                "active_ids": list(active_voters.keys())
            }
            
        except Exception as e:
            logger.error(f"Error removing voter from plan {plan_id}: {e}")
            # Fallback to in-memory if Redis fails
            return self._fallback_leave(plan_id, voter_id)
    
    def get_active_voters(self, plan_id: str) -> List[Dict[str, Any]]:
        """Get list of active voters for a plan"""
        try:
            plan_key = self._get_plan_key(plan_id)
            active_voters = self.cache.get(plan_key) or {}
            
            # Clean up expired voters
            current_time = datetime.utcnow()
            clean_voters = {}
            
            for voter_id, voter_data in active_voters.items():
                try:
                    last_activity = datetime.fromisoformat(voter_data['last_activity'])
                    if (current_time - last_activity).total_seconds() < self.session_timeout:
                        clean_voters[voter_id] = voter_data
                    else:
                        # Clean up expired voter
                        voter_key = self._get_voter_key(plan_id, voter_id)
                        self.cache.delete(voter_key)
                except Exception as e:
                    logger.warning(f"Error parsing voter timestamp: {e}")
            
            # Update cleaned list in Redis
            if clean_voters != active_voters:
                if clean_voters:
                    self.cache.set(plan_key, clean_voters, ttl=self.session_timeout)
                else:
                    self.cache.delete(plan_key)
            
            # Format for response
            result = []
            for voter_id, voter_data in clean_voters.items():
                result.append({
                    "id": voter_id,
                    "name": voter_data.get("name", "Unknown"),
                    "joined_at": voter_data.get("joined_at"),
                    "last_activity": voter_data.get("last_activity")
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting active voters for plan {plan_id}: {e}")
            # Fallback to in-memory if Redis fails
            return self._fallback_get_active(plan_id)
    
    def update_activity(self, plan_id: str, voter_id: str) -> bool:
        """Update last activity timestamp for a voter"""
        try:
            voter_key = self._get_voter_key(plan_id, voter_id)
            voter_data = self.cache.get(voter_key)
            
            if voter_data:
                voter_data['last_activity'] = datetime.utcnow().isoformat()
                self.cache.set(voter_key, voter_data, ttl=self.session_timeout)
                
                # Also update in plan data
                plan_key = self._get_plan_key(plan_id)
                active_voters = self.cache.get(plan_key) or {}
                if voter_id in active_voters:
                    active_voters[voter_id]['last_activity'] = voter_data['last_activity']
                    self.cache.set(plan_key, active_voters, ttl=self.session_timeout)
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating activity for voter {voter_id}: {e}")
            return False
    
    def get_plan_stats(self, plan_id: str) -> Dict[str, Any]:
        """Get statistics for a plan's active voters"""
        active_voters = self.get_active_voters(plan_id)
        return {
            "plan_id": plan_id,
            "active_count": len(active_voters),
            "active_voters": active_voters,
            "cache_enabled": self.cache.enabled
        }
    
    # Fallback methods for when Redis is not available
    _fallback_storage = {}
    
    def _fallback_join(self, plan_id: str, voter_id: str, name: str) -> Dict[str, Any]:
        """Fallback to in-memory storage when Redis unavailable"""
        store = self._fallback_storage.setdefault(plan_id, {})
        now = datetime.utcnow().isoformat()
        store[voter_id] = {
            "name": name,
            "joined_at": now,
            "last_activity": now
        }
        return {
            "plan_id": plan_id,
            "active_count": len(store),
            "active_ids": list(store.keys())
        }
    
    def _fallback_leave(self, plan_id: str, voter_id: str) -> Dict[str, Any]:
        """Fallback to in-memory storage when Redis unavailable"""
        store = self._fallback_storage.setdefault(plan_id, {})
        store.pop(voter_id, None)
        return {
            "plan_id": plan_id,
            "active_count": len(store),
            "active_ids": list(store.keys())
        }
    
    def _fallback_get_active(self, plan_id: str) -> List[Dict[str, Any]]:
        """Fallback to in-memory storage when Redis unavailable"""
        store = self._fallback_storage.get(plan_id, {})
        result = []
        for voter_id, voter_data in store.items():
            result.append({
                "id": voter_id,
                "name": voter_data.get("name", "Unknown"),
                "joined_at": voter_data.get("joined_at"),
                "last_activity": voter_data.get("last_activity")
            })
        return result

# Global instance
active_voter_manager = ActiveVoterManager()