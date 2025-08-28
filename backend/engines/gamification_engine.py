"""
Choosy Gamification Engine
Copyright (c) 2024 rtavarezz

Advanced gamification system for user engagement and retention.
Licensed under MIT License - see LICENSE file.

This proprietary system provides intelligent reward mechanisms,
achievement tracking, and user progression analytics.
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
class Achievement:
    type: str
    name: str
    description: str
    points: int
    icon: str
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None

@dataclass
class UserStats:
    points: int
    level: int
    streak: int
    achievements: List[str]
    total_plans_created: int
    total_votes_cast: int
    categories_explored: int

class GamificationEngine:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        
        # Achievement definitions
        self.achievements = {
            'first_plan': {
                'name': 'Planner',
                'description': 'Create your first plan',
                'points': 50,
                'icon': '📋'
            },
            'voter_streak': {
                'name': 'Voting Champion',
                'description': 'Vote on 5 plans in a row',
                'points': 100,
                'icon': '🗳️'
            },
            'category_explorer': {
                'name': 'Explorer',
                'description': 'Try 5 different event categories',
                'points': 150,
                'icon': '🗺️'
            },
            'social_butterfly': {
                'name': 'Social Butterfly',
                'description': 'Participate in 10 group plans',
                'points': 200,
                'icon': '🦋'
            },
            'adventure_seeker': {
                'name': 'Adventure Seeker',
                'description': 'Create 3 adventure plans',
                'points': 75,
                'icon': '🏔️'
            },
            'foodie_master': {
                'name': 'Foodie Master',
                'description': 'Create 5 foodie plans',
                'points': 75,
                'icon': '🍕'
            },
            'nightlife_king': {
                'name': 'Nightlife King',
                'description': 'Create 5 nightlife plans',
                'points': 75,
                'icon': '🌙'
            },
            'culture_vulture': {
                'name': 'Culture Vulture',
                'description': 'Create 5 art/comedy plans',
                'points': 75,
                'icon': '🎭'
            },
            'daily_user': {
                'name': 'Daily User',
                'description': 'Use the app for 7 days in a row',
                'points': 300,
                'icon': '📅'
            },
            'event_attender': {
                'name': 'Event Attender',
                'description': 'Mark 3 events as attended',
                'points': 150,
                'icon': '✅'
            }
        }
        
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)
    
    async def award_points(
        self, 
        user_id: str, 
        action: str, 
        action_data: Dict = None
    ) -> Dict:
        """
        Award points for user actions
        Returns: {'points_awarded': int, 'new_total': int, 'level_up': bool, 'achievements_unlocked': List}
        """
        try:
            # Calculate points for action
            points = self._calculate_points_for_action(action, action_data)
            
            if points == 0:
                return {'points_awarded': 0, 'new_total': 0, 'level_up': False, 'achievements_unlocked': []}
            
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Get current user stats
            cur.execute("""
                SELECT gamification FROM users WHERE id = %s
            """, (user_id,))
            
            result = cur.fetchone()
            if not result:
                return {'points_awarded': 0, 'new_total': 0, 'level_up': False, 'achievements_unlocked': []}
            
            current_stats = result[0] or {}
            current_points = current_stats.get('points', 0)
            current_level = current_stats.get('level', 1)
            current_streak = current_stats.get('streak', 0)
            
            # Update points and check for level up
            new_points = current_points + points
            new_level = self._calculate_level(new_points)
            level_up = new_level > current_level
            
            # Update streak if it's a daily action
            new_streak = self._update_streak(current_streak, action)
            
            # Update user stats
            updated_stats = {
                'points': new_points,
                'level': new_level,
                'streak': new_streak,
                'achievements': current_stats.get('achievements', [])
            }
            
            cur.execute("""
                UPDATE users 
                SET gamification = %s, last_active = NOW()
                WHERE id = %s
            """, (json.dumps(updated_stats), user_id))
            
            # Check for new achievements
            achievements_unlocked = await self._check_achievements(user_id, action, action_data)
            
            # Update achievements in user stats
            if achievements_unlocked:
                updated_stats['achievements'].extend(achievements_unlocked)
                cur.execute("""
                    UPDATE users 
                    SET gamification = %s
                    WHERE id = %s
                """, (json.dumps(updated_stats), user_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'points_awarded': points,
                'new_total': new_points,
                'level_up': level_up,
                'achievements_unlocked': achievements_unlocked,
                'new_level': new_level,
                'streak': new_streak
            }
            
        except Exception as e:
            print(f"Error awarding points: {e}")
            return {'points_awarded': 0, 'new_total': 0, 'level_up': False, 'achievements_unlocked': []}
    
    def _calculate_points_for_action(self, action: str, action_data: Dict = None) -> int:
        """Calculate points for different user actions"""
        points_map = {
            'create_plan': 25,
            'vote_on_event': 5,
            'like_event': 3,
            'dislike_event': 1,
            'share_plan': 10,
            'attend_event': 15,
            'explore_category': 2,
            'daily_login': 5,
            'weekly_streak': 50,
            'monthly_streak': 200
        }
        
        base_points = points_map.get(action, 0)
        
        # Bonus points for daily login streak
        if action == 'daily_login' and action_data:
            streak = action_data.get('streak', 0)
            if streak >= 7:
                base_points += 25  # Weekly bonus
            if streak >= 30:
                base_points += 100  # Monthly bonus
        
        return base_points
    
    def _calculate_level(self, points: int) -> int:
        """Calculate user level based on points"""
        # Level 1: 0-99 points
        # Level 2: 100-299 points
        # Level 3: 300-599 points
        # etc.
        if points < 100:
            return 1
        else:
            return 1 + int(math.sqrt((points - 100) / 200) + 1)
    
    def _update_streak(self, current_streak: int, action: str) -> int:
        """Update user streak based on action"""
        daily_actions = ['daily_login', 'create_plan', 'vote_on_event']
        
        if action in daily_actions:
            return current_streak + 1
        else:
            return current_streak
    
    async def _check_achievements(self, user_id: str, action: str, action_data: Dict = None) -> List[str]:
        """Check if user has unlocked new achievements"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Get user stats
            cur.execute("""
                SELECT gamification FROM users WHERE id = %s
            """, (user_id,))
            
            result = cur.fetchone()
            if not result:
                return []
            
            user_stats = result[0] or {}
            current_achievements = user_stats.get('achievements', [])
            
            # Get user activity data
            cur.execute("""
                SELECT COUNT(*) FROM plans WHERE host_phone = (SELECT phone FROM users WHERE id = %s)
            """, (user_id,))
            plans_created = cur.fetchone()[0]
            
            cur.execute("""
                SELECT COUNT(*) FROM votes WHERE voter_id = %s
            """, (user_id,))
            votes_cast = cur.fetchone()[0]
            
            cur.execute("""
                SELECT COUNT(DISTINCT topic) FROM plans WHERE host_phone = (SELECT phone FROM users WHERE id = %s)
            """, (user_id,))
            categories_explored = cur.fetchone()[0]
            
            # Check for new achievements
            new_achievements = []
            
            # First plan achievement
            if plans_created >= 1 and 'first_plan' not in current_achievements:
                new_achievements.append('first_plan')
            
            # Voting streak achievement
            if votes_cast >= 5 and 'voter_streak' not in current_achievements:
                new_achievements.append('voter_streak')
            
            # Category explorer achievement
            if categories_explored >= 5 and 'category_explorer' not in current_achievements:
                new_achievements.append('category_explorer')
            
            # Daily user achievement
            streak = user_stats.get('streak', 0)
            if streak >= 7 and 'daily_user' not in current_achievements:
                new_achievements.append('daily_user')
            
            # Category-specific achievements
            cur.execute("""
                SELECT topic, COUNT(*) FROM plans 
                WHERE host_phone = (SELECT phone FROM users WHERE id = %s)
                GROUP BY topic
            """, (user_id,))
            
            category_counts = dict(cur.fetchall())
            
            if category_counts.get('adventure', 0) >= 3 and 'adventure_seeker' not in current_achievements:
                new_achievements.append('adventure_seeker')
            
            if category_counts.get('foodie', 0) >= 5 and 'foodie_master' not in current_achievements:
                new_achievements.append('foodie_master')
            
            if category_counts.get('nightlife', 0) >= 5 and 'nightlife_king' not in current_achievements:
                new_achievements.append('nightlife_king')
            
            if (category_counts.get('art', 0) + category_counts.get('comedy', 0)) >= 5 and 'culture_vulture' not in current_achievements:
                new_achievements.append('culture_vulture')
            
            # Record new achievements
            for achievement_type in new_achievements:
                cur.execute("""
                    INSERT INTO user_achievements (user_id, achievement_type, achievement_data)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, achievement_type) DO NOTHING
                """, (user_id, achievement_type, json.dumps({'unlocked_at': datetime.now().isoformat()})))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return new_achievements
            
        except Exception as e:
            print(f"Error checking achievements: {e}")
            return []
    
    async def get_user_stats(self, user_id: str) -> UserStats:
        """Get comprehensive user statistics"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Get gamification data
            cur.execute("""
                SELECT gamification FROM users WHERE id = %s
            """, (user_id,))
            
            result = cur.fetchone()
            if not result:
                return UserStats(0, 1, 0, [], 0, 0, 0)
            
            gamification = result[0] or {}
            
            # Get activity counts
            cur.execute("""
                SELECT COUNT(*) FROM plans WHERE host_phone = (SELECT phone FROM users WHERE id = %s)
            """, (user_id,))
            total_plans_created = cur.fetchone()[0]
            
            cur.execute("""
                SELECT COUNT(*) FROM votes WHERE voter_id = %s
            """, (user_id,))
            total_votes_cast = cur.fetchone()[0]
            
            cur.execute("""
                SELECT COUNT(DISTINCT topic) FROM plans WHERE host_phone = (SELECT phone FROM users WHERE id = %s)
            """, (user_id,))
            categories_explored = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            
            return UserStats(
                points=gamification.get('points', 0),
                level=gamification.get('level', 1),
                streak=gamification.get('streak', 0),
                achievements=gamification.get('achievements', []),
                total_plans_created=total_plans_created,
                total_votes_cast=total_votes_cast,
                categories_explored=categories_explored
            )
            
        except Exception as e:
            print(f"Error getting user stats: {e}")
            return UserStats(0, 1, 0, [], 0, 0, 0)
    
    async def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Get top users by points"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT u.name, u.gamification->>'points' as points, u.gamification->>'level' as level
                FROM users u
                WHERE u.gamification->>'points' IS NOT NULL
                ORDER BY (u.gamification->>'points')::int DESC
                LIMIT %s
            """, (limit,))
            
            leaderboard = []
            for row in cur.fetchall():
                leaderboard.append({
                    'name': row[0],
                    'points': int(row[1]) if row[1] else 0,
                    'level': int(row[2]) if row[2] else 1
                })
            
            cur.close()
            conn.close()
            
            return leaderboard
            
        except Exception as e:
            print(f"Error getting leaderboard: {e}")
            return []
    
    def get_achievement_info(self, achievement_type: str) -> Optional[Dict]:
        """Get information about a specific achievement"""
        return self.achievements.get(achievement_type)
    
    def get_all_achievements(self) -> Dict[str, Dict]:
        """Get all available achievements"""
        return self.achievements 