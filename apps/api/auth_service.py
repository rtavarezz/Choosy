"""
Authentication Service for Choosy
Handles user registration, login, social auth, and session management
"""

import os
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import JWTError, jwt
import re

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Database
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class AuthService:
    """Authentication service for user management"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create a refresh token"""
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "type": "refresh",
            "jti": str(uuid.uuid4())
        }
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password(password: str) -> Dict[str, Any]:
        """Validate password strength"""
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    @classmethod
    def register_user(cls, email: str, password: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """Register a new user"""
        try:
            # Validate input
            if not cls.validate_email(email):
                return {"success": False, "error": "Invalid email format"}
            
            password_validation = cls.validate_password(password)
            if not password_validation["valid"]:
                return {"success": False, "error": "Password validation failed", "details": password_validation["errors"]}
            
            with engine.connect() as conn:
                # Check if user already exists
                existing_user = conn.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": email.lower()}
                ).fetchone()
                
                if existing_user:
                    return {"success": False, "error": "User with this email already exists"}
                
                # Create user
                user_id = str(uuid.uuid4())
                password_hash = cls.get_password_hash(password)
                
                conn.execute(
                    text("""
                        INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
                        VALUES (:id, :email, :password_hash, :display_name, NOW(), NOW())
                    """),
                    {
                        "id": user_id,
                        "email": email.lower(),
                        "password_hash": password_hash,
                        "display_name": display_name or email.split('@')[0]
                    }
                )
                
                # Create session
                refresh_token = cls.create_refresh_token(user_id)
                conn.execute(
                    text("""
                        INSERT INTO user_sessions (user_id, refresh_token, expires_at)
                        VALUES (:user_id, :refresh_token, NOW() + INTERVAL '7 days')
                    """),
                    {
                        "user_id": user_id,
                        "refresh_token": refresh_token
                    }
                )
                
                conn.commit()
                
                # Create access token
                access_token = cls.create_access_token(data={"sub": user_id})
                
                return {
                    "success": True,
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "display_name": display_name or email.split('@')[0]
                }
                
        except Exception as e:
            return {"success": False, "error": f"Registration failed: {str(e)}"}
    
    @classmethod
    def login_user(cls, email: str, password: str) -> Dict[str, Any]:
        """Login a user"""
        try:
            with engine.connect() as conn:
                # Get user
                user = conn.execute(
                    text("""
                        SELECT id, email, password_hash, display_name, is_active, email_verified
                        FROM users WHERE email = :email
                    """),
                    {"email": email.lower()}
                ).fetchone()
                
                if not user:
                    return {"success": False, "error": "Invalid email or password"}
                
                if not user[4]:  # is_active
                    return {"success": False, "error": "Account is deactivated"}
                
                # Verify password
                if not cls.verify_password(password, user[2]):  # password_hash
                    return {"success": False, "error": "Invalid email or password"}
                
                user_id = user[0]
                
                # Update last login
                conn.execute(
                    text("UPDATE users SET last_login = NOW() WHERE id = :id"),
                    {"id": user_id}
                )
                
                # Create new session
                refresh_token = cls.create_refresh_token(user_id)
                conn.execute(
                    text("""
                        INSERT INTO user_sessions (user_id, refresh_token, expires_at)
                        VALUES (:user_id, :refresh_token, NOW() + INTERVAL '7 days')
                    """),
                    {
                        "user_id": user_id,
                        "refresh_token": refresh_token
                    }
                )
                
                conn.commit()
                
                # Create access token
                access_token = cls.create_access_token(data={"sub": user_id})
                
                return {
                    "success": True,
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "display_name": user[3],  # display_name
                    "email_verified": user[5]  # email_verified
                }
                
        except Exception as e:
            return {"success": False, "error": f"Login failed: {str(e)}"}
    
    @classmethod
    def refresh_token(cls, refresh_token: str) -> Dict[str, Any]:
        """Refresh an access token using a refresh token"""
        try:
            # Verify refresh token
            payload = cls.verify_token(refresh_token)
            if not payload or payload.get("type") != "refresh":
                return {"success": False, "error": "Invalid refresh token"}
            
            user_id = payload.get("sub")
            if not user_id:
                return {"success": False, "error": "Invalid refresh token"}
            
            with engine.connect() as conn:
                # Check if session exists and is valid
                session = conn.execute(
                    text("""
                        SELECT id FROM user_sessions 
                        WHERE user_id = :user_id AND refresh_token = :refresh_token AND expires_at > NOW()
                    """),
                    {"user_id": user_id, "refresh_token": refresh_token}
                ).fetchone()
                
                if not session:
                    return {"success": False, "error": "Invalid or expired refresh token"}
                
                # Create new access token
                access_token = cls.create_access_token(data={"sub": user_id})
                
                return {
                    "success": True,
                    "access_token": access_token
                }
                
        except Exception as e:
            return {"success": False, "error": f"Token refresh failed: {str(e)}"}
    
    @classmethod
    def logout_user(cls, refresh_token: str) -> Dict[str, Any]:
        """Logout a user by invalidating their session"""
        try:
            with engine.connect() as conn:
                # Delete session
                result = conn.execute(
                    text("DELETE FROM user_sessions WHERE refresh_token = :refresh_token"),
                    {"refresh_token": refresh_token}
                )
                
                conn.commit()
                
                if result.rowcount > 0:
                    return {"success": True, "message": "Logged out successfully"}
                else:
                    return {"success": False, "error": "Invalid refresh token"}
                    
        except Exception as e:
            return {"success": False, "error": f"Logout failed: {str(e)}"}
    
    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            with engine.connect() as conn:
                user = conn.execute(
                    text("""
                        SELECT id, email, display_name, avatar_url, phone, 
                               timezone, preferences, created_at, last_login
                        FROM users WHERE id = :id AND is_active = true
                    """),
                    {"id": user_id}
                ).fetchone()
                
                if user:
                    return {
                        "id": user[0],
                        "email": user[1],
                        "display_name": user[2],
                        "avatar_url": user[3],
                        "phone": user[4],
                        "timezone": user[5],
                        "preferences": user[6] if user[6] else {},
                        "created_at": user[7],
                        "last_login": user[8]
                    }
                return None
                
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    @classmethod
    def update_user_profile(cls, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        try:
            allowed_fields = {'display_name', 'avatar_url', 'phone', 'timezone', 'preferences'}
            valid_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            
            if not valid_updates:
                return {"success": False, "error": "No valid fields to update"}
            
            with engine.connect() as conn:
                # Build dynamic update query
                set_clauses = []
                params = {"user_id": user_id}
                
                for field, value in valid_updates.items():
                    set_clauses.append(f"{field} = :{field}")
                    params[field] = value
                
                set_clauses.append("updated_at = NOW()")
                
                query = f"""
                    UPDATE users 
                    SET {', '.join(set_clauses)}
                    WHERE id = :user_id AND is_active = true
                """
                
                result = conn.execute(text(query), params)
                conn.commit()
                
                if result.rowcount > 0:
                    return {"success": True, "message": "Profile updated successfully"}
                else:
                    return {"success": False, "error": "User not found or not active"}
                    
        except Exception as e:
            return {"success": False, "error": f"Profile update failed: {str(e)}"}
    
    @classmethod
    def social_login(cls, provider: str, social_id: str, email: str, display_name: str, avatar_url: Optional[str] = None) -> Dict[str, Any]:
        """Handle social login (Google, Apple)"""
        try:
            with engine.connect() as conn:
                # Check if user exists by social ID
                user = conn.execute(
                    text(f"""
                        SELECT id, email, display_name, is_active 
                        FROM users 
                        WHERE {provider}_id = :social_id
                    """),
                    {"social_id": social_id}
                ).fetchone()
                
                if user:
                    # Existing user - update last login
                    user_id = user[0]
                    conn.execute(
                        text("UPDATE users SET last_login = NOW() WHERE id = :id"),
                        {"id": user_id}
                    )
                else:
                    # Check if user exists by email
                    existing_user = conn.execute(
                        text("SELECT id FROM users WHERE email = :email"),
                        {"email": email.lower()}
                    ).fetchone()
                    
                    if existing_user:
                        # Link social account to existing user
                        user_id = existing_user[0]
                        conn.execute(
                            text(f"UPDATE users SET {provider}_id = :social_id, last_login = NOW() WHERE id = :id"),
                            {"social_id": social_id, "id": user_id}
                        )
                    else:
                        # Create new user
                        user_id = str(uuid.uuid4())
                        conn.execute(
                            text(f"""
                                INSERT INTO users (id, email, display_name, avatar_url, {provider}_id, email_verified, created_at, updated_at)
                                VALUES (:id, :email, :display_name, :avatar_url, :social_id, true, NOW(), NOW())
                            """),
                            {
                                "id": user_id,
                                "email": email.lower(),
                                "display_name": display_name,
                                "avatar_url": avatar_url,
                                "social_id": social_id
                            }
                        )
                
                # Create session
                refresh_token = cls.create_refresh_token(user_id)
                conn.execute(
                    text("""
                        INSERT INTO user_sessions (user_id, refresh_token, expires_at)
                        VALUES (:user_id, :refresh_token, NOW() + INTERVAL '7 days')
                    """),
                    {
                        "user_id": user_id,
                        "refresh_token": refresh_token
                    }
                )
                
                conn.commit()
                
                # Create access token
                access_token = cls.create_access_token(data={"sub": user_id})
                
                return {
                    "success": True,
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "display_name": display_name,
                    "email_verified": True
                }
                
        except Exception as e:
            return {"success": False, "error": f"Social login failed: {str(e)}"} 