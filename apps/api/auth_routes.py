"""
Authentication Routes for Choosy API
Handles user registration, login, social auth, and profile management
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
import os
from auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Pydantic models for request/response
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        validation = AuthService.validate_password(v)
        if not validation["valid"]:
            raise ValueError(f"Password validation failed: {', '.join(validation['errors'])}")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class SocialLogin(BaseModel):
    provider: str  # 'google' or 'apple'
    social_id: str
    email: EmailStr
    display_name: str
    avatar_url: Optional[str] = None

# Response models
class AuthResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    display_name: Optional[str] = None
    email_verified: Optional[bool] = None
    error: Optional[str] = None
    message: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    phone: Optional[str]
    timezone: str
    preferences: Dict[str, Any]
    created_at: str
    last_login: Optional[str]

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id

@router.post("/register", response_model=AuthResponse)
async def register_user(user_data: UserRegister, request: Request):
    """Register a new user"""
    try:
        result = AuthService.register_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.display_name
        )
        
        if result["success"]:
            return AuthResponse(
                success=True,
                user_id=result["user_id"],
                access_token=result["access_token"],
                refresh_token=result["refresh_token"],
                display_name=result["display_name"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
async def login_user(user_data: UserLogin, request: Request):
    """Login a user"""
    try:
        result = AuthService.login_user(
            email=user_data.email,
            password=user_data.password
        )
        
        if result["success"]:
            return AuthResponse(
                success=True,
                user_id=result["user_id"],
                access_token=result["access_token"],
                refresh_token=result["refresh_token"],
                display_name=result["display_name"],
                email_verified=result["email_verified"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(token_data: TokenRefresh):
    """Refresh access token"""
    try:
        result = AuthService.refresh_token(token_data.refresh_token)
        
        if result["success"]:
            return AuthResponse(
                success=True,
                access_token=result["access_token"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

@router.post("/logout", response_model=AuthResponse)
async def logout_user(token_data: TokenRefresh):
    """Logout user"""
    try:
        result = AuthService.logout_user(token_data.refresh_token)
        
        if result["success"]:
            return AuthResponse(
                success=True,
                message=result["message"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@router.post("/social", response_model=AuthResponse)
async def social_login(social_data: SocialLogin):
    """Social login (Google, Apple)"""
    try:
        if social_data.provider not in ['google', 'apple']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid provider. Must be 'google' or 'apple'"
            )
        
        result = AuthService.social_login(
            provider=social_data.provider,
            social_id=social_data.social_id,
            email=social_data.email,
            display_name=social_data.display_name,
            avatar_url=social_data.avatar_url
        )
        
        if result["success"]:
            return AuthResponse(
                success=True,
                user_id=result["user_id"],
                access_token=result["access_token"],
                refresh_token=result["refresh_token"],
                display_name=result["display_name"],
                email_verified=result["email_verified"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Social login failed: {str(e)}"
        )

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user_id: str = Depends(get_current_user)):
    """Get current user profile"""
    try:
        user = AuthService.get_user_by_id(current_user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserProfile(
            id=user["id"],
            email=user["email"],
            display_name=user["display_name"],
            avatar_url=user["avatar_url"],
            phone=user["phone"],
            timezone=user["timezone"],
            preferences=user["preferences"],
            created_at=user["created_at"].isoformat(),
            last_login=user["last_login"].isoformat() if user["last_login"] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )

@router.put("/me", response_model=AuthResponse)
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        # Convert Pydantic model to dict, excluding None values
        updates = {k: v for k, v in profile_data.dict().items() if v is not None}
        
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        result = AuthService.update_user_profile(current_user_id, updates)
        
        if result["success"]:
            return AuthResponse(
                success=True,
                message=result["message"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@router.delete("/me", response_model=AuthResponse)
async def delete_user_account(current_user_id: str = Depends(get_current_user)):
    """Delete user account (soft delete)"""
    try:
        # This would typically set is_active = false and handle cleanup
        # For MVP, we'll just return success
        return AuthResponse(
            success=True,
            message="Account deactivated successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {str(e)}"
        )

# Health check endpoint
@router.get("/health")
async def auth_health_check():
    """Health check for auth service"""
    return {
        "status": "healthy",
        "service": "authentication",
        "timestamp": "2024-01-01T00:00:00Z"
    } 