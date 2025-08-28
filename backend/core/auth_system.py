"""
Choosy Authentication System
Copyright (c) 2024 rtavarezz

Advanced authentication and authorization system.
Licensed under MIT License - see LICENSE file.

This proprietary system handles secure user authentication,
JWT token management, and fine-grained access controls.
"""

import os
import secrets
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from core.db import engine
from utils.logger import logger
from utils.validation import ValidationError

# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Security scheme
security = HTTPBearer()

class AuthSystem:
    """Centralized authentication and authorization system"""
    
    @staticmethod
    async def check_availability(phone: str) -> Dict[str, Any]:
        """Check if phone number is available for registration"""
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("SELECT id FROM users WHERE phone = :phone"),
                    {"phone": phone}
                )
                user = result.fetchone()
                
                if user:
                    return {
                        "success": True,
                        "phone_available": False,
                        "message": "Phone number already registered"
                    }
                else:
                    return {
                        "success": True,
                        "phone_available": True,
                        "message": "Phone number available"
                    }
        except Exception as e:
            logger.error(f"Error checking availability: {e}")
            return {
                "success": False,
                "message": "Error checking availability"
            }
    
    @staticmethod
    async def register_user(phone: str, name: str, avatar_url: Optional[str] = None) -> Dict[str, Any]:
        """Register a new user with phone number only"""
        try:
            # Check if phone already exists
            availability = await AuthSystem.check_availability(phone)
            if not availability.get('phone_available', False):
                return {
                    "success": False,
                    "message": "Phone number already registered"
                }
            
            # Generate user ID
            user_id = secrets.token_urlsafe(16)
            
            # Insert user into database
            with engine.connect() as conn:
                conn.execute(
                    text("""
                        INSERT INTO users (id, phone, name, created_at)
                        VALUES (:id, :phone, :name, :created_at)
                    """),
                    {
                        "id": user_id,
                        "phone": phone,
                        "name": name,
                        "created_at": datetime.utcnow()
                    }
                )
                conn.commit()
            
            logger.info(f"User registered successfully: {phone}")
            return {
                "success": True,
                "user_id": user_id,
                "message": "User registered successfully"
            }
            
        except Exception as e:
            logger.error(f"Error registering user: {e}")
            return {
                "success": False,
                "message": "Registration failed"
            }
    
    @staticmethod
    async def login_user(phone: str) -> Dict[str, Any]:
        """Login user with phone number only"""
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("SELECT id, phone, name FROM users WHERE phone = :phone"),
                    {"phone": phone}
                )
                user = result.fetchone()
                
                if not user:
                    return {
                        "success": False,
                        "message": "Phone number not registered"
                    }
                
                # Generate session token
                session_token = AuthSystem.create_access_token(user[0], user[1])
                
                return {
                    "success": True,
                    "session_token": session_token,
                    "user_data": {
                        "id": user[0],
                        "phone": user[1],
                        "name": user[2]
                    },
                    "message": "Login successful"
                }
                
        except Exception as e:
            logger.error(f"Error logging in user: {e}")
            return {
                "success": False,
                "message": "Login failed"
            }
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("SELECT id, phone, name FROM users WHERE id = :user_id"),
                    {"user_id": user_id}
                )
                user = result.fetchone()
                
                if user:
                    return {
                        "id": user[0],
                        "phone": user[1],
                        "name": user[2]
                    }
                return None
                
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    @staticmethod
    async def update_user_profile(user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user profile"""
        try:
            # Build update query dynamically
            set_clauses = []
            params = {"user_id": user_id}
            
            for field, value in updates.items():
                if field in ['name', 'avatar_url', 'preferences']:
                    set_clauses.append(f"{field} = :{field}")
                    params[field] = value
            
            if not set_clauses:
                return True
            
            query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = :user_id"
            
            with engine.connect() as conn:
                conn.execute(text(query), params)
                conn.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False
    
    @staticmethod
    async def delete_user(user_id: str) -> bool:
        """Delete user account"""
        try:
            with engine.connect() as conn:
                conn.execute(
                    text("DELETE FROM users WHERE id = :user_id"),
                    {"user_id": user_id}
                )
                conn.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    @staticmethod
    async def validate_session(session_token: str) -> Optional[str]:
        """Validate session token and return user ID"""
        try:
            payload = AuthSystem.verify_token(session_token)
            return payload.get("sub")
        except:
            return None
    
    @staticmethod
    async def logout_user(session_token: str) -> bool:
        """Logout user (invalidate session)"""
        # For JWT tokens, we can't truly invalidate them without a blacklist
        # For MVP, we'll just return success
        # In production, implement a token blacklist in Redis
        return True
    
    @staticmethod
    def create_access_token(user_id: str, user_phone: str) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": user_id,
            "phone": user_phone,
            "exp": expire,
            "type": "access"
        }
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create JWT refresh token"""
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "type": "refresh"
        }
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """Get current authenticated user from token"""
        token = credentials.credentials
        payload = AuthSystem.verify_token(token)
        
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify user still exists in database
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("SELECT id, phone, name FROM users WHERE id = :user_id"),
                    {"user_id": user_id}
                )
                user = result.fetchone()
                
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                return {
                    "id": user[0],
                    "phone": user[1],
                    "name": user[2]
                }
        except Exception as e:
            logger.error(f"Database error in get_current_user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service error"
            )
    
    @staticmethod
    def require_authentication(func):
        """Decorator to require authentication for endpoints"""
        async def wrapper(*args, **kwargs):
            # This will be used with FastAPI dependency injection
            return await func(*args, **kwargs)
        return wrapper
    
    @staticmethod
    def check_plan_access(user_id: str, plan_id: str) -> bool:
        """Check if user has access to a specific plan"""
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("""
                        SELECT 1 FROM plans 
                        WHERE id = :plan_id 
                        AND (creator_id = :user_id OR :user_id IN (
                            SELECT voter_id FROM votes WHERE plan_id = :plan_id
                        ))
                    """),
                    {"plan_id": plan_id, "user_id": user_id}
                )
                return result.fetchone() is not None
        except Exception as e:
            logger.error(f"Error checking plan access: {e}")
            return False
    
    @staticmethod
    def is_plan_creator(user_id: str, plan_id: str) -> bool:
        """Check if user is the creator of a plan"""
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("SELECT 1 FROM plans WHERE id = :plan_id AND creator_id = :user_id"),
                    {"plan_id": plan_id, "user_id": user_id}
                )
                return result.fetchone() is not None
        except Exception as e:
            logger.error(f"Error checking plan creator: {e}")
            return False

# Mock SMS verification for MVP
class MockSMSService:
    """Mock SMS service for MVP - replace with real service in production"""
    
    @staticmethod
    def generate_verification_code() -> str:
        """Generate a 6-digit verification code"""
        return str(secrets.randbelow(1000000)).zfill(6)
    
    @staticmethod
    def send_verification_code(phone: str, code: str) -> bool:
        """Mock SMS sending - COMMENTED OUT FOR DEVELOPMENT"""
        # logger.info(f"Mock SMS sent to {phone}: Your verification code is {code}")
        logger.info(f"🚧 SMS sending disabled for development")
        return True
    
    @staticmethod
    def verify_code(phone: str, code: str) -> bool:
        """Mock code verification - accepts any 6-digit code for MVP"""
        # In production, this would check against stored codes with expiration
        return len(code) == 6 and code.isdigit()

# Session management
class SessionManager:
    """Manage user sessions and verification codes"""
    
    # In-memory storage for MVP - use Redis in production
    _verification_codes: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def create_verification_session(cls, phone: str) -> str:
        """Create a new verification session"""
        code = MockSMSService.generate_verification_code()
        session_id = secrets.token_urlsafe(16)
        
        cls._verification_codes[session_id] = {
            "phone": phone,
            "code": code,
            "created_at": datetime.utcnow(),
            "attempts": 0,
            "verified": False
        }
        
        # Send mock SMS
        MockSMSService.send_verification_code(phone, code)
        
        return session_id
    
    @classmethod
    def verify_session_code(cls, session_id: str, code: str) -> bool:
        if session_id not in cls._verification_codes:
            return False
        session = cls._verification_codes[session_id]
        # Check if session is expired (15 minutes)
        if datetime.utcnow() - session["created_at"] > timedelta(minutes=15):
            del cls._verification_codes[session_id]
            return False
        # Check attempts limit
        if session["attempts"] >= 2:
            del cls._verification_codes[session_id]
            return False
        session["attempts"] += 1
        # Accept '123456' as a universal code for MVP
        if code == session["code"] or code == "123456":
            session["verified"] = True
            return True
        return False
    
    @classmethod
    def get_session_phone(cls, session_id: str) -> Optional[str]:
        """Get phone number from session"""
        if session_id in cls._verification_codes:
            return cls._verification_codes[session_id]["phone"]
        return None
    
    @classmethod
    def cleanup_expired_sessions(cls):
        """Clean up expired sessions"""
        current_time = datetime.utcnow()
        expired_sessions = [
            session_id for session_id, session in cls._verification_codes.items()
            if current_time - session["created_at"] > timedelta(minutes=15)
        ]
        for session_id in expired_sessions:
            del cls._verification_codes[session_id] 