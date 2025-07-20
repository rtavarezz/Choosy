"""
Event Recommendation Engine
Suggests events to users based on their preferences and past interactions
"""

import json
import math
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass
class UserPreference:
    category: str
    score: float  # 0.0 to 1.0
    interaction_count: int
    last_interaction: datetime

@dataclass
class EventRecommendation:
    event_id: str
    name: str
    category: str
    confidence_score: float  # 0.0 to 1.0
    reasoning: str
    personalization_factors: List[str]

class AIRecommendationEngine:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)
    
    async def get_personalized_recommendations(
        self, 
        user_id: str, 
        category: str = None, 
        limit: int = 10
    ) -> List[EventRecommendation]:
        """
        Get personalized event recommendations for a user
        Analyzes user preferences and history to suggest relevant events
        """
        try:
            # Get user preferences
            preferences = await self._get_user_preferences(user_id)
            
            # Get user event history
            history = await self._get_user_event_history(user_id)
            
            # Get available events
            events = await self._get_available_events(category)
            
            # Score and rank events
            recommendations = []
            for event in events:
                score, reasoning, factors = self._calculate_personalization_score(
                    event, preferences, history, user_id
                )
                
                recommendations.append(EventRecommendation(
                    event_id=event['id'],
                    name=event['name'],
                    category=event['category'],
                    confidence_score=score,
                    reasoning=reasoning,
                    personalization_factors=factors
                ))
            
            # Sort by confidence score and return top results
            recommendations.sort(key=lambda x: x.confidence_score, reverse=True)
            return recommendations[:limit]
            
        except Exception as e:
            print(f"❌ Recommendation error: {e}")
            return []
    
    async def _get_user_preferences(self, user_id: str) -> List[UserPreference]:
        """Get user's learned preferences from database"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT category, preference_score, interaction_count, last_interaction
                FROM user_preferences 
                WHERE user_id = %s
                ORDER BY preference_score DESC
            """, (user_id,))
            
            preferences = []
            for row in cur.fetchall():
                preferences.append(UserPreference(
                    category=row[0],
                    score=row[1],
                    interaction_count=row[2],
                    last_interaction=row[3]
                ))
            
            cur.close()
            conn.close()
            return preferences
            
        except Exception as e:
            print(f"Error getting user preferences: {e}")
            return []
    
    async def _get_user_event_history(self, user_id: str) -> List[Dict]:
        """Get user's event interaction history from database"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT ueh.interaction_type, ueh.interaction_data, e.category, e.name
                FROM user_event_history ueh
                JOIN events e ON ueh.event_id = e.id
                WHERE ueh.user_id = %s
                ORDER BY ueh.created_at DESC
                LIMIT 100
            """, (user_id,))
            
            history = []
            for row in cur.fetchall():
                history.append({
                    'interaction_type': row[0],
                    'interaction_data': row[1],
                    'category': row[2],
                    'event_name': row[3]
                })
            
            cur.close()
            conn.close()
            return history
            
        except Exception as e:
            print(f"Error getting user history: {e}")
            return []
    
    async def _get_available_events(self, category: str = None) -> List[Dict]:
        """Get available events to recommend from database"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            if category:
                cur.execute("""
                    SELECT id, name, category, metadata
                    FROM events 
                    WHERE category = %s
                    ORDER BY votes_count DESC
                    LIMIT 50
                """, (category,))
            else:
                cur.execute("""
                    SELECT id, name, category, metadata
                    FROM events 
                    ORDER BY votes_count DESC
                    LIMIT 50
                """)
            
            events = []
            for row in cur.fetchall():
                events.append({
                    'id': row[0],
                    'name': row[1],
                    'category': row[2],
                    'metadata': row[3] or {}
                })
            
            cur.close()
            conn.close()
            return events
            
        except Exception as e:
            print(f"Error getting available events: {e}")
            return []
    
    def _calculate_personalization_score(
        self, 
        event: Dict, 
        preferences: List[UserPreference], 
        history: List[Dict],
        user_id: str
    ) -> Tuple[float, str, List[str]]:
        """
        Calculate how well an event matches the user's preferences
        Uses preference scores and interaction history to rank events
        """
        score = 0.5  # Base score
        factors = []
        reasoning_parts = []
        
        # Factor 1: Category preference (40% weight)
        category_pref = next((p for p in preferences if p.category == event['category']), None)
        if category_pref:
            category_score = category_pref.score
            score += (category_score - 0.5) * 0.4  # Scale to ±0.2
            factors.append(f"Category preference: {category_pref.category} ({category_score:.2f})")
            reasoning_parts.append(f"Loves {event['category']} events")
        else:
            factors.append("No category preference data")
            reasoning_parts.append("New category to explore")
        
        # Factor 2: Historical interactions (30% weight)
        category_history = [h for h in history if h['category'] == event['category']]
        if category_history:
            positive_interactions = sum(1 for h in category_history if h['interaction_type'] in ['liked', 'voted', 'attended'])
            total_interactions = len(category_history)
            history_score = positive_interactions / total_interactions if total_interactions > 0 else 0.5
            score += (history_score - 0.5) * 0.3  # Scale to ±0.15
            factors.append(f"History: {positive_interactions}/{total_interactions} positive interactions")
            reasoning_parts.append(f"Has enjoyed {event['category']} events before")
        
        # Factor 3: Event popularity (20% weight)
        votes_count = event.get('metadata', {}).get('votes_count', 0)
        popularity_score = min(votes_count / 10, 1.0)  # Normalize to 0-1
        score += popularity_score * 0.2
        factors.append(f"Popularity: {votes_count} votes")
        if votes_count > 5:
            reasoning_parts.append("Popular choice among users")
        
        # Factor 4: Time-based factors (10% weight)
        # Prefer events happening soon
        event_time = event.get('metadata', {}).get('start_time')
        if event_time:
            try:
                event_dt = datetime.fromisoformat(event_time.replace('Z', '+00:00'))
                days_until = (event_dt - datetime.now()).days
                if days_until <= 1:
                    score += 0.1  # Bonus for today/tomorrow
                    factors.append("Happening soon")
                    reasoning_parts.append("Perfect timing")
            except:
                pass
        
        # Clamp score to 0-1 range
        score = max(0.0, min(1.0, score))
        
        # Generate reasoning
        reasoning = " | ".join(reasoning_parts) if reasoning_parts else "Based on general preferences"
        
        return score, reasoning, factors
    
    async def learn_from_interaction(
        self, 
        user_id: str, 
        event_id: str, 
        interaction_type: str,
        interaction_data: Dict = None
    ):
        """
        Learn from user interactions to improve future recommendations
        Updates user preferences based on their actions
        """
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Get event category
            cur.execute("SELECT category FROM events WHERE id = %s", (event_id,))
            result = cur.fetchone()
            if not result:
                return
            
            category = result[0]
            
            # Record the interaction
            cur.execute("""
                INSERT INTO user_event_history (user_id, event_id, interaction_type, interaction_data)
                VALUES (%s, %s, %s, %s)
            """, (user_id, event_id, interaction_type, json.dumps(interaction_data or {})))
            
            # Update user preferences
            learning_rate = self._get_learning_rate(interaction_type)
            
            cur.execute("""
                INSERT INTO user_preferences (user_id, category, preference_score, interaction_count)
                VALUES (%s, %s, %s, 1)
                ON CONFLICT (user_id, category) 
                DO UPDATE SET 
                    preference_score = user_preferences.preference_score + %s,
                    interaction_count = user_preferences.interaction_count + 1,
                    last_interaction = NOW(),
                    updated_at = NOW()
            """, (user_id, category, 0.5 + learning_rate, learning_rate))
            
            # Clamp preference score to 0-1 range
            cur.execute("""
                UPDATE user_preferences 
                SET preference_score = GREATEST(0.0, LEAST(1.0, preference_score))
                WHERE user_id = %s AND category = %s
            """, (user_id, category))
            
            conn.commit()
            cur.close()
            conn.close()
            
            print(f"📊 Updated preferences from {interaction_type} interaction for {category}")
            
        except Exception as e:
            print(f"Error learning from interaction: {e}")
    
    def _get_learning_rate(self, interaction_type: str) -> float:
        """Get preference adjustment rate based on interaction type"""
        rates = {
            'liked': 0.1,      # Positive learning
            'disliked': -0.1,  # Negative learning
            'voted': 0.05,     # Mild positive
            'attended': 0.15,  # Strong positive
            'shared': 0.08,    # Positive
            'viewed': 0.02     # Very mild positive
        }
        return rates.get(interaction_type, 0.0)
    
    async def get_user_insights(self, user_id: str) -> Dict:
        """Get insights about user's preferences and behavior patterns"""
        try:
            preferences = await self._get_user_preferences(user_id)
            history = await self._get_user_event_history(user_id)
            
            # Calculate insights
            favorite_category = max(preferences, key=lambda p: p.score) if preferences else None
            most_active_category = max(preferences, key=lambda p: p.interaction_count) if preferences else None
            
            total_interactions = len(history)
            positive_interactions = sum(1 for h in history if h['interaction_type'] in ['liked', 'voted', 'attended'])
            
            insights = {
                'favorite_category': favorite_category.category if favorite_category else None,
                'most_active_category': most_active_category.category if most_active_category else None,
                'total_interactions': total_interactions,
                'positive_rate': positive_interactions / total_interactions if total_interactions > 0 else 0,
                'preferences_count': len(preferences),
                'last_active': max([p.last_interaction for p in preferences]) if preferences else None
            }
            
            return insights
            
        except Exception as e:
            print(f"Error getting user insights: {e}")
            return {} 