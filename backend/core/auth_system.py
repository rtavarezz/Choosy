"""
Authentication System for Choosy
Secure user authentication and session management
"""

import secrets
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

class AuthSystem:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        self.session_duration = timedelta(days=30)  # 30 day sessions
        
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)
    
    async def register_user(
        self, 
        phone: str, 
        name: str, 
        email: str = None,
        avatar_url: str = None
    ) -> Dict:
        """
        Register a new user account
        Returns: {'success': bool, 'user_id': str, 'message': str}
        """
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
            if cur.fetchone():
                cur.close()
                conn.close()
                return {'success': False, 'message': 'User already exists with this phone number'}
            
            # Create new user
            cur.execute("""
                INSERT INTO users (phone, name, email, avatar_url, preferences, ai_profile, gamification)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                phone, 
                name, 
                email, 
                avatar_url,
                json.dumps({}),  # Empty preferences
                json.dumps({}),  # Empty user profile
                json.dumps({"points": 0, "level": 1, "streak": 0, "achievements": []})  # Initial gamification
            ))
            
            user_id = cur.fetchone()[0]
            
            # Create initial user profile
            cur.execute("""
                INSERT INTO ai_user_profiles (user_id, profile_data)
                VALUES (%s, %s)
            """, (user_id, json.dumps({
                'learning_rate': 0.1,
                'preference_stability': 0.5,
                'exploration_factor': 0.3,
                'last_updated': datetime.now().isoformat()
            })))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'success': True, 
                'user_id': str(user_id), 
                'message': 'User registered successfully'
            }
            
        except Exception as e:
            print(f"Error registering user: {e}")
            return {'success': False, 'message': 'Registration failed'}
    
    async def login_user(self, phone: str) -> Dict:
        """
        Login a user with phone number
        Returns: {'success': bool, 'session_token': str, 'user_data': Dict, 'message': str}
        """
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Get user data
            cur.execute("""
                SELECT id, name, email, avatar_url, preferences, gamification, last_active
                FROM users WHERE phone = %s
            """, (phone,))
            
            result = cur.fetchone()
            if not result:
                cur.close()
                conn.close()
                return {'success': False, 'message': 'User not found'}
            
            user_id, name, email, avatar_url, preferences, gamification, last_active = result
            
            # Generate session token
            session_token = self._generate_session_token()
            expires_at = datetime.now() + self.session_duration
            
            # Create session
            cur.execute("""
                INSERT INTO user_sessions (user_id, session_token, expires_at)
                VALUES (%s, %s, %s)
            """, (user_id, session_token, expires_at))
            
            # Update last active
            cur.execute("""
                UPDATE users SET last_active = NOW() WHERE id = %s
            """, (user_id,))
            
            conn.commit()
            cur.close()
            conn.close()
            
            user_data = {
                'id': str(user_id),
                'name': name,
                'phone': phone,
                'email': email,
                'avatar_url': avatar_url,
                'preferences': preferences or {},
                'gamification': gamification or {},
                'last_active': last_active.isoformat() if last_active else None
            }
            
            return {
                'success': True,
                'session_token': session_token,
                'user_data': user_data,
                'message': 'Login successful'
            }
            
        except Exception as e:
            print(f"Error logging in user: {e}")
            return {'success': False, 'message': 'Login failed'}
    
    async def validate_session(self, session_token: str) -> Optional[str]:
        """
        Validate session token and return user_id if valid
        Returns: user_id if valid, None if invalid
        """
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Check if session exists and is not expired
            cur.execute("""
                SELECT user_id FROM user_sessions 
                WHERE session_token = %s AND expires_at > NOW()
            """, (session_token,))
            
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            if result:
                return str(result[0])
            else:
                return None
                
        except Exception as e:
            print(f"Error validating session: {e}")
            return None
    
    async def logout_user(self, session_token: str) -> bool:
        """Logout user by invalidating session token"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                DELETE FROM user_sessions WHERE session_token = %s
            """, (session_token,))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error logging out user: {e}")
            return False
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user data by ID"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT id, name, phone, email, avatar_url, preferences, gamification, last_active, created_at
                FROM users WHERE id = %s
            """, (user_id,))
            
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            if result:
                return {
                    'id': str(result[0]),
                    'name': result[1],
                    'phone': result[2],
                    'email': result[3],
                    'avatar_url': result[4],
                    'preferences': result[5] or {},
                    'gamification': result[6] or {},
                    'last_active': result[7].isoformat() if result[7] else None,
                    'created_at': result[8].isoformat() if result[8] else None
                }
            else:
                return None
                
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    async def update_user_profile(
        self, 
        user_id: str, 
        updates: Dict
    ) -> bool:
        """Update user profile information"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            allowed_fields = ['name', 'email', 'avatar_url', 'preferences']
            
            for field, value in updates.items():
                if field in allowed_fields:
                    update_fields.append(f"{field} = %s")
                    update_values.append(value)
            
            if not update_fields:
                return False
            
            update_values.append(user_id)
            
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}, updated_at = NOW()
                WHERE id = %s
            """
            
            cur.execute(query, update_values)
            conn.commit()
            cur.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return False
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user account and all associated data"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Delete user sessions
            cur.execute("DELETE FROM user_sessions WHERE user_id = %s", (user_id,))
            
            # Delete user achievements
            cur.execute("DELETE FROM user_achievements WHERE user_id = %s", (user_id,))
            
            # Delete AI profile
            cur.execute("DELETE FROM ai_user_profiles WHERE user_id = %s", (user_id,))
            
            # Delete user preferences
            cur.execute("DELETE FROM user_preferences WHERE user_id = %s", (user_id,))
            
            # Delete user event history
            cur.execute("DELETE FROM user_event_history WHERE user_id = %s", (user_id,))
            
            # Delete user plans
            cur.execute("DELETE FROM user_plans WHERE user_phone = (SELECT phone FROM users WHERE id = %s)", (user_id,))
            
            # Delete user
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    def _generate_session_token(self) -> str:
        """Generate a secure session token"""
        return secrets.token_urlsafe(32)
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions and return count of deleted sessions"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                DELETE FROM user_sessions WHERE expires_at < NOW()
            """)
            
            deleted_count = cur.rowcount
            conn.commit()
            cur.close()
            conn.close()
            
            return deleted_count
            
        except Exception as e:
            print(f"Error cleaning up sessions: {e}")
            return 0 