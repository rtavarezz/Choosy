"""
User Endpoints for Choosy
Authentication, personalized recommendations, and gamification features
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, validator
from typing import Optional, List, Dict
import json
import re

from core.auth_system import AuthSystem
from engines.ai_recommendation_engine import AIRecommendationEngine
from engines.gamification_engine import GamificationEngine

router = APIRouter(prefix="/api/users", tags=["users"])

# Initialize engines
auth_system = AuthSystem()
ai_engine = AIRecommendationEngine()
gamification_engine = GamificationEngine()

# Pydantic models with validation
class UserRegistration(BaseModel):
    phone: str
    name: str
    avatar_url: Optional[str] = None

    @validator('phone')
    def validate_phone(cls, v):
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', v)
        if len(digits_only) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        return digits_only

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

class UserLogin(BaseModel):
    phone: str

    @validator('phone')
    def validate_phone(cls, v):
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', v)
        if len(digits_only) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        return digits_only

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict] = None

class EventInteraction(BaseModel):
    event_id: str
    interaction_type: str  # 'viewed', 'liked', 'disliked', 'voted', 'attended', 'shared'
    interaction_data: Optional[Dict] = None

# Dependency to get current user
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    session_token = authorization.replace("Bearer ", "")
    user_id = await auth_system.validate_session(session_token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user_id

@router.get("/check-availability")
async def check_availability(phone: Optional[str] = None):
    """Check if phone number is available for registration"""
    if not phone:
        raise HTTPException(status_code=400, detail="Please provide phone number to check")
    
    result = await auth_system.check_availability(phone=phone)
    
    if result['success']:
        return {
            "success": True,
            "phone_available": result.get('phone_available', True),
            "message": result['message']
        }
    else:
        raise HTTPException(status_code=500, detail=result['message'])

@router.post("/register")
async def register_user(user_data: UserRegistration):
    """Register a new user account"""
    result = await auth_system.register_user(
        phone=user_data.phone,
        name=user_data.name,
        avatar_url=user_data.avatar_url
    )
    
    if result['success']:
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": result['user_id']
        }
    else:
        raise HTTPException(status_code=400, detail=result['message'])

@router.post("/login")
async def login_user(login_data: UserLogin):
    """Login user with phone number verification"""
    result = await auth_system.login_user(login_data.phone)
    
    if result['success']:
        return {
            "success": True,
            "message": "Login successful",
            "session_token": result['session_token'],
            "user_data": result['user_data']
        }
    else:
        raise HTTPException(status_code=401, detail=result['message'])

@router.post("/logout")
async def logout_user(current_user: str = Depends(get_current_user), authorization: str = Header(None)):
    """Logout user and invalidate session"""
    session_token = authorization.replace("Bearer ", "")
    success = await auth_system.logout_user(session_token)
    
    if success:
        return {"success": True, "message": "Logout successful"}
    else:
        raise HTTPException(status_code=500, detail="Logout failed")

@router.get("/profile")
async def get_user_profile(current_user: str = Depends(get_current_user)):
    """Get current user's profile information"""
    user_data = await auth_system.get_user_by_id(current_user)
    
    if user_data:
        return {
            "success": True,
            "user_data": user_data
        }
    else:
        raise HTTPException(status_code=404, detail="User not found")

@router.put("/profile")
async def update_user_profile(
    updates: UserUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update user profile information"""
    update_data = {}
    if updates.name is not None:
        update_data['name'] = updates.name
    if updates.email is not None:
        update_data['email'] = updates.email
    if updates.avatar_url is not None:
        update_data['avatar_url'] = updates.avatar_url
    if updates.preferences is not None:
        update_data['preferences'] = json.dumps(updates.preferences)
    
    success = await auth_system.update_user_profile(current_user, update_data)
    
    if success:
        return {"success": True, "message": "Profile updated successfully"}
    else:
        raise HTTPException(status_code=500, detail="Profile update failed")

@router.delete("/account")
async def delete_user_account(current_user: str = Depends(get_current_user)):
    """Delete user account and all associated data"""
    success = await auth_system.delete_user(current_user)
    
    if success:
        return {"success": True, "message": "Account deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail="Account deletion failed")

# Recommendation Endpoints
@router.get("/recommendations")
async def get_personalized_recommendations(
    category: Optional[str] = None,
    limit: int = 10,
    current_user: str = Depends(get_current_user)
):
    """Get personalized event recommendations based on user preferences"""
    recommendations = await ai_engine.get_personalized_recommendations(
        user_id=current_user,
        category=category,
        limit=limit
    )
    
    return {
        "success": True,
        "recommendations": [
            {
                "event_id": rec.event_id,
                "name": rec.name,
                "category": rec.category,
                "confidence_score": rec.confidence_score,
                "reasoning": rec.reasoning,
                "personalization_factors": rec.personalization_factors
            }
            for rec in recommendations
        ]
    }

@router.post("/interactions")
async def record_event_interaction(
    interaction: EventInteraction,
    current_user: str = Depends(get_current_user)
):
    """Record user interaction with an event to improve recommendations"""
    # Learn from interaction
    await ai_engine.learn_from_interaction(
        user_id=current_user,
        event_id=interaction.event_id,
        interaction_type=interaction.interaction_type,
        interaction_data=interaction.interaction_data
    )
    
    # Award points for interaction
    points_result = await gamification_engine.award_points(
        user_id=current_user,
        action=interaction.interaction_type,
        action_data=interaction.interaction_data
    )
    
    return {
        "success": True,
        "message": "Interaction recorded",
        "preferences_updated": "User preferences updated",
        "points_awarded": points_result.get('points_awarded', 0)
    }

@router.get("/insights")
async def get_user_insights(current_user: str = Depends(get_current_user)):
    """Get insights about user's preferences and behavior patterns"""
    insights = await ai_engine.get_user_insights(current_user)
    
    return {
        "success": True,
        "insights": insights
    }

# Gamification Endpoints
@router.get("/stats")
async def get_user_stats(current_user: str = Depends(get_current_user)):
    """Get user's gamification statistics"""
    stats = await gamification_engine.get_user_stats(current_user)
    
    return {
        "success": True,
        "stats": stats
    }

@router.get("/achievements")
async def get_user_achievements(current_user: str = Depends(get_current_user)):
    """Get user's unlocked achievements"""
    stats = await gamification_engine.get_user_stats(current_user)
    
    return {
        "success": True,
        "achievements": {
            "unlocked": stats.get('achievements', []),
            "total_achievements": len(stats.get('achievements', [])),
            "recent_unlocks": stats.get('recent_achievements', [])
        }
    }

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get global leaderboard of top users"""
    leaderboard = await gamification_engine.get_leaderboard(limit)
    
    return {
        "success": True,
        "leaderboard": leaderboard
    }

# Action Recording Endpoints
@router.post("/actions/create-plan")
async def record_plan_creation(current_user: str = Depends(get_current_user)):
    """Record when user creates a new plan"""
    result = await gamification_engine.award_points(
        user_id=current_user,
        action='create_plan',
        action_data={'timestamp': 'now'}
    )
    
    return {
        "success": True,
        "message": "Plan creation recorded",
        "points_awarded": result.get('points_awarded', 0)
    }

@router.post("/actions/daily-login")
async def record_daily_login(current_user: str = Depends(get_current_user)):
    """Record daily login for streak tracking"""
    stats = await gamification_engine.get_user_stats(current_user)
    
    result = await gamification_engine.award_points(
        user_id=current_user,
        action='daily_login',
        action_data={'timestamp': 'now'}
    )
    
    return {
        "success": True,
        "message": "Daily login recorded",
        "points_awarded": result.get('points_awarded', 0),
        "current_streak": stats.get('current_streak', 0)
    }

@router.post("/actions/explore-category")
async def record_category_exploration(
    category: str,
    current_user: str = Depends(get_current_user)
):
    """Record when user explores a new category"""
    result = await gamification_engine.award_points(
        user_id=current_user,
        action='explore_category',
        action_data={'category': category}
    )
    
    return {
        "success": True,
        "message": "Category exploration recorded",
        "points_awarded": result.get('points_awarded', 0)
    } 