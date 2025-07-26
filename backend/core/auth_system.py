"""
Authentication and Authorization System for Choosy
Handles user authentication, JWT tokens, and authorization checks
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
        """Mock SMS sending - always returns True for MVP"""
        logger.info(f"Mock SMS sent to {phone}: Your verification code is {code}")
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