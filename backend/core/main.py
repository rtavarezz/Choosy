from fastapi import FastAPI, HTTPException, Depends, status, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel, field_validator
from typing import List, Optional
import os
import secrets
import uuid
import json
import traceback
import re
from better_profanity import profanity

# Import location service
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from services.location_services import location_service
from services.geocoding_service import geocoding_service
from services.api_config import api_template_manager
from core.cache_manager import cache_manager, cached
from core.db import engine, SessionLocal, Base
from utils.validation import ValidationError
from core.user_endpoints import router as user_router
from core.auth_system import AuthSystem, SessionManager, MockSMSService
from utils.validation import InputValidator, ErrorHandler, validate_and_sanitize_input
from utils.monitoring import (
    setup_monitoring, get_health_status, monitor_performance, 
    log_user_action, log_security_event, start_periodic_monitoring
)

# Import rate limiter
from core.rate_limiter import rate_limiter, get_client_id

# Import logger
from utils.logger import logger, log_api_request, log_error

# Name validation function
def validate_name(name: str) -> bool:
    """Validate name for appropriateness and format"""
    if not name or not isinstance(name, str):
        return False
    
    trimmed_name = name.strip()
    
    # Check length (2-30 characters)
    if len(trimmed_name) < 2 or len(trimmed_name) > 30:
        return False
    
    # Check for only letters, spaces, hyphens, and apostrophes
    if not re.match(r'^[a-zA-Z\s\-\']+$', trimmed_name):
        return False
    
    # Check for system/test names
    system_words = [
        'admin', 'moderator', 'system', 'test', 'fake', 'spam', 'bot', 'robot',
        'anonymous', 'anon', 'unknown', 'nobody', 'someone', 'anyone', 'everyone'
    ]
    
    lower_name = trimmed_name.lower()
    for word in system_words:
        if word in lower_name:
            return False
    
    # Use profanity filter for comprehensive profanity detection
    if profanity.contains_profanity(trimmed_name):
        return False
    
    # Check for excessive repetition (like "aaaaaa")
    if re.search(r'(.)\1{4,}', trimmed_name):
        return False
    
    # Check for excessive spaces
    if '  ' in trimmed_name:
        return False
    
    return True

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Password-related functions are not used in MVP ---
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Optimize database connection with pooling
# engine = create_engine(
#     DATABASE_URL,
#     pool_size=20,
#     max_overflow=30,
#     pool_pre_ping=True,
#     pool_recycle=3600,
#     pool_timeout=30,
#     echo=os.getenv("DEBUG", "false").lower() == "true"  # Log SQL queries in debug mode
# )
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Setup monitoring
setup_monitoring(engine)
start_periodic_monitoring()

app = FastAPI(title="Choosy API", description="API for Choosy group decision making app")

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

# Security middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """Log requests and apply rate limiting"""
    import time
    
    start_time = time.time()
    
    # Rate limiting
    client_id = get_client_id(request)
    allowed, info = rate_limiter.is_allowed(client_id)
    
    if not allowed:
        logger.warning(f"Rate limit exceeded for {client_id}")
        return JSONResponse(
            status_code=429,
            content={
                "error": info["error"],
                "message": info["message"],
                "retry_after": info["retry_after"]
            }
        )
    
    # Process request
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Log successful request
        log_api_request(
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            duration=duration
        )
        
        # Add rate limit headers
        response.headers["X-RateLimit-Remaining-Minute"] = str(info["remaining_minute"])
        response.headers["X-RateLimit-Remaining-Hour"] = str(info["remaining_hour"])
        
        return response
        
    except Exception as e:
        duration = time.time() - start_time
        log_error(e, f"Request {request.method} {request.url}", client_id)
        raise

# Include user endpoints
app.include_router(user_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions gracefully"""
    error_id = str(uuid.uuid4())
    
    # Log the error for debugging
    logger.error(f"❌ Error {error_id}: {str(exc)}")
    logger.error(f"📍 URL: {request.url}")
    logger.error(f"🔍 Method: {request.method}")
    logger.error(f"📄 Traceback: {traceback.format_exc()}")
    
    # Return user-friendly error
    return JSONResponse(
        status_code=500,
        content={
            "error": "Something went wrong",
            "error_id": error_id,
            "message": "We're working on fixing this. Please try again.",
            "status": "error"
        }
    )

@app.exception_handler(Exception)
async def database_exception_handler(request: Request, exc: Exception):
    """Handle database connection errors"""
    if "connection" in str(exc).lower() or "database" in str(exc).lower():
        logger.error(f"Database connection error: {str(exc)}")
        return JSONResponse(
            status_code=503,
            content={
                "error": "Database temporarily unavailable",
                "message": "Please try again in a moment",
                "status": "error"
        }
    )
    raise exc

class PlanCreate(BaseModel):
    topic: str
    group_size: str
    zip_code: str
    host_name: str
    host_phone: str
    custom_events: Optional[List[dict]] = []
    
    # Input validation
    @field_validator('topic')
    def validate_topic(cls, v):
        valid_topics = ['concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family']
        if v not in valid_topics:
            raise ValueError(f'Topic must be one of: {valid_topics}')
        return v
    
    @field_validator('group_size')
    def validate_group_size(cls, v):
        valid_sizes = ['solo', 'date', 'friend', 'group']
        if v not in valid_sizes:
            raise ValueError(f'Group size must be one of: {valid_sizes}')
        return v
    
    @field_validator('zip_code')
    def validate_zip_code(cls, v):
        if not v or len(v) < 3 or len(v) > 10:
            raise ValueError('ZIP code must be 3-10 characters')
        return v
    
    @field_validator('host_name')
    def validate_host_name(cls, v):
        if not validate_name(v):
            raise ValueError('Please choose an appropriate name (2-30 characters, letters only)')
        return v.strip()
    
    @field_validator('host_phone')
    def validate_host_phone(cls, v):
        import re
        # Remove all non-digit characters except + at the beginning
        cleaned = re.sub(r'[^\d+]', '', v)
        # Ensure it starts with + or has at least 10 digits
        if not (cleaned.startswith('+') and len(cleaned) >= 11) and not (len(cleaned) >= 10):
            raise ValueError('Invalid phone number format')
        return cleaned

class VoteCreate(BaseModel):
    plan_id: str
    event_id: str
    voter_id: str
    vote_type: str

class ReservationCreate(BaseModel):
    activity_type: str
    event_name: str
    user_name: str
    phone_number: str
    group_size: Optional[str] = "myself"
    event_time: Optional[str] = "7:00 PM"
    event_date: Optional[str] = None

    @field_validator('user_name')
    def validate_user_name(cls, v):
        if not validate_name(v):
            raise ValueError('Please choose an appropriate name (2-30 characters, letters only)')
        return v.strip()

class UserCreate(BaseModel):
    name: str
    phone: str
    
    @field_validator('name')
    def validate_name_field(cls, v):
        if not validate_name(v):
            raise ValueError('Please choose an appropriate name (2-30 characters, letters only)')
        return v.strip()

# --- Password-related functions are not used in MVP ---
# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)
#
# def get_password_hash(password):
#     return pwd_context.hash(password)

# Remove old JWT functions since they're now in AuthSystem
# def create_access_token(data: dict, expires_delta: timedelta = None):
# def verify_token(token: str):

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = AuthSystem.verify_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception
@app.get("/")
def health():
    """Health check endpoint with comprehensive monitoring"""
    return get_health_status()

@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            return {"db": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test")
def test():
    return test_db()

@app.get("/api/geocode")
async def geocode_zipcode(zipcode: str = Query(None), lat: float = Query(None), lng: float = Query(None)):
    """Convert zipcode to coordinates, or lat/lng to zipcode"""
    try:
        if zipcode:
            coordinates = await geocoding_service.get_coordinates_from_zipcode(zipcode)
            if coordinates:
                lat_val, lng_val = coordinates
                return {"lat": lat_val, "lng": lng_val}
            else:
                raise HTTPException(status_code=404, detail="Could not geocode zipcode")
        elif lat is not None and lng is not None:
            zipcode_val = await geocoding_service.get_zipcode_from_coordinates(lat, lng)
            if zipcode_val:
                return {"zipcode": zipcode_val}
            else:
                raise HTTPException(status_code=404, detail="Could not reverse geocode coordinates")
        else:
            raise HTTPException(status_code=400, detail="Must provide either zipcode or lat/lng")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events")
async def get_events(lat: float, lng: float, category: str = "adventure", radius: int = 5000, limit: int = 20):
    """Get events near coordinates"""
    try:
        # Import the global event API
        from services.global_event_apis import global_event_api
        
        # Get real events from global APIs using coordinates directly
        events = await global_event_api.get_events_for_location(
            lat=lat, 
            lng=lng, 
            category=category, 
            radius=radius, 
            limit=limit
        )
        
        # Convert GlobalEvent objects to dictionaries for JSON serialization
        event_dicts = []
        for event in events:
            event_dict = {
                'id': event.id,
                'name': event.name,
                'description': event.description,
                'image_url': event.image_url,
                'start_time': event.start_time.isoformat() if event.start_time else None,
                'end_time': event.end_time.isoformat() if event.end_time else None,
                'venue': event.venue,
                'address': event.address,
                'city': event.city,
                'state': event.state,
                'zip_code': event.zip_code,
                'price': event.price,
                'category': event.category,
                'source': event.source.value if event.source else 'unknown',
                'external_id': event.external_id,
                'external_url': event.external_url,
                'organizer': event.organizer,
                'attendees_count': event.attendees_count,
                'max_attendees': event.max_attendees,
                'is_free': event.is_free,
                'is_featured': event.is_featured,
                'metadata': event.metadata
            }
            event_dicts.append(event_dict)
        
        return event_dicts
    except Exception as e:
        print(f"Error getting events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/plans")
async def create_plan(
    plan_data: dict,
    current_user: dict = Depends(AuthSystem.get_current_user)
):
    """Create a new plan (requires authentication)"""
    try:
        # Validate and sanitize plan data
        validated_data = InputValidator.validate_plan_data(plan_data)
        
        # Create plan with authenticated user as creator
        plan_id = str(uuid.uuid4())
        
        with engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO plans (id, title, description, zip_code, group_size, creator_id, created_at, updated_at)
                    VALUES (:id, :title, :description, :zip_code, :group_size, :creator_id, NOW(), NOW())
                """),
                {
                    "id": plan_id,
                    "title": validated_data["title"],
                    "description": validated_data.get("description", ""),
                    "zip_code": validated_data["zip_code"],
                    "group_size": validated_data["group_size"],
                    "creator_id": current_user["id"]
                }
            )
            conn.commit()
        
        return {
            "success": True,
            "plan_id": plan_id,
            "message": "Plan created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating plan: {e}")
        if isinstance(e, ValidationError):
            raise ErrorHandler.handle_validation_error(e)
        raise HTTPException(status_code=500, detail="Failed to create plan")

@app.post("/api/plans/{plan_id}/vote")
async def vote_on_option(
    plan_id: str,
    vote_data: dict,
    current_user: dict = Depends(AuthSystem.get_current_user)
):
    """Vote on an option (requires authentication and plan access)"""
    try:
        # Validate plan_id
        validated_plan_id = InputValidator.validate_uuid(plan_id, "plan_id")
        
        # Check if user has access to this plan
        if not AuthSystem.check_plan_access(current_user["id"], validated_plan_id):
            raise HTTPException(status_code=403, detail="Access denied to this plan")
        
        # Validate vote data
        validated_vote_data = InputValidator.validate_vote_data(vote_data)
        
        # Record vote
        vote_id = str(uuid.uuid4())
        
        with engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO votes (id, plan_id, voter_id, option_id, vote_type, created_at)
                    VALUES (:id, :plan_id, :voter_id, :option_id, :vote_type, NOW())
                """),
                {
                    "id": vote_id,
                    "plan_id": validated_plan_id,
                    "voter_id": current_user["id"],
                    "option_id": validated_vote_data["option_id"],
                    "vote_type": validated_vote_data["vote_type"]
                }
            )
            conn.commit()
        
        return {
            "success": True,
            "vote_id": vote_id,
            "message": "Vote recorded successfully"
        }
    except Exception as e:
        logger.error(f"Error recording vote: {e}")
        if isinstance(e, ValidationError):
            raise ErrorHandler.handle_validation_error(e)
        raise HTTPException(status_code=500, detail="Failed to record vote")

@app.post("/api/plans/{plan_id}/events")
def create_events_for_plan(plan_id: str, events: List[dict]):
    try:
        with engine.connect() as conn:
            plan_result = conn.execute(
                text("SELECT id FROM plans WHERE id = :id"),
                {"id": plan_id}
            )
            if not plan_result.fetchone():
                raise HTTPException(status_code=404, detail="Plan not found")
            
            for event in events:
                event_id = str(uuid.uuid4())
                conn.execute(
                    text("""
                        INSERT INTO events (id, plan_id, name, image, hours, source_type, votes_count, metadata)
                        VALUES (:id, :plan_id, :name, :image, :hours, :source_type, 0, :metadata)
                    """),
                    {
                        "id": event_id,
                        "plan_id": plan_id,
                        "name": event.get("name", "Event"),
                        "image": event.get("image"),
                        "hours": event.get("hours"),
                        "source_type": event.get("source_type", "custom"),
                        "metadata": json.dumps(event.get("metadata", {}))
                    }
                )
            
            conn.commit()
            return {"message": f"Created {len(events)} events for plan {plan_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans/{plan_id}/events")
def get_events_for_plan(plan_id: str):
    try:
        with engine.connect() as conn:
            plan_result = conn.execute(
                text("SELECT id FROM plans WHERE id = :id"),
                {"id": plan_id}
            )
            if not plan_result.fetchone():
                raise HTTPException(status_code=404, detail="Plan not found")
            
            events_result = conn.execute(
                text("""
                    SELECT id, name, image, hours, source_type, votes_count, metadata
                    FROM events 
                    WHERE plan_id = :plan_id
                    ORDER BY votes_count DESC, name ASC
                """),
                {"plan_id": plan_id}
            )
            
            events = []
            for row in events_result:
                metadata = {}
                print(f"🔍 Row data: {row}")
                print(f"🔍 Row metadata: {row[6]} (type: {type(row[6])})")
                if row[6] and row[6] != '{}':
                    try:
                        if isinstance(row[6], str):
                            metadata = json.loads(row[6])
                        else:
                            metadata = row[6]  # Already a dict if it's JSONB
                        print(f"✅ Parsed metadata: {metadata}")
                    except (json.JSONDecodeError, TypeError) as e:
                        metadata = {}
                        print(f"❌ JSON error: {e}")
                else:
                    print(f"⚠️ Empty metadata")
                
                # Format the event data for frontend
                event_data = {
                    "id": row[0],
                    "name": row[1],
                    "image": row[2] or metadata.get('image_url'),
                    "hours": row[3] or metadata.get('hours', 'Hours not available'),
                    "source_type": row[4],
                    "votes_count": row[5] or 0,
                    "metadata": metadata,
                    # Include contact info and other details for frontend
                    "venue": metadata.get('venue', ''),
                    "address": metadata.get('address', ''),
                    "city": metadata.get('city', ''),
                    "state": metadata.get('state', ''),
                    "zip_code": metadata.get('zip_code', ''),
                    "price": metadata.get('price', ''),
                    "category": metadata.get('category', ''),
                    "phone": metadata.get('phone'),
            
                    "description": metadata.get('description', '') or f"Experience the best {metadata.get('category', 'local')} vibes at {row[1]}. Perfect for {metadata.get('category', 'fun')} activities and memorable moments.",
                    "organizer": metadata.get('organizer', ''),
                    "external_url": metadata.get('external_url'),
                    # Add reviews data with realistic defaults
                    "reviews": {
                        "count": metadata.get('review_count', metadata.get('user_ratings_total', 42)),  # Use actual ratings if available
                        "stars": metadata.get('rating', metadata.get('stars', 4.2))  # Use actual rating if available
                    },
                    # Add topic for proper display
                    "topic": metadata.get('topic', 'nightlife'),
                    # Add contact info for display
                    "contact": {
                        "phone": metadata.get('phone', '+1 212-997-4144'),
                
                    }
                }
                
                events.append(event_data)
            
            return {"events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans/{plan_id}/voting-status")
def get_voting_status(plan_id: str):
    """Get current voting status and limits for a plan"""
    try:
        with engine.connect() as conn:
            # Get plan details
            plan_result = conn.execute(
                text("SELECT topic, group_size, host_name, host_phone FROM plans WHERE id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchone()
            
            if not plan_result:
                raise HTTPException(status_code=404, detail="Plan not found")
            
            plan = {
                "topic": plan_result[0],
                "group_size": plan_result[1],
                "host_name": plan_result[2],
                "host_phone": plan_result[3]
            }
            
            # Get total number of events in this plan
            total_events_result = conn.execute(
                text("SELECT COUNT(*) FROM events WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchone()
            total_events = total_events_result[0] if total_events_result else 0
            
            # Get voters who have completed voting (voted on all events)
            completed_voters_result = conn.execute(
                text("""
                    SELECT voter_id, COUNT(*) as votes_cast
                    FROM votes 
                    WHERE plan_id = :plan_id
                    GROUP BY voter_id
                    HAVING COUNT(*) >= :total_events
                """),
                {"plan_id": plan_id, "total_events": total_events}
            ).fetchall()
            completed_voters = len(completed_voters_result)
            
            # Get total unique voters who have voted at least once
            total_voters_result = conn.execute(
                text("""
                    SELECT COUNT(DISTINCT voter_id) as total_voters 
                    FROM votes 
                    WHERE plan_id = :plan_id
                """),
                {"plan_id": plan_id}
            ).fetchone()
            total_voters = total_voters_result[0] if total_voters_result else 0
            
            # Get active voters count from the active voters system
            active_voters_count = 0
            active_voter_ids = []
            if plan_id in active_voters:
                # Clean up inactive voters (more than 5 minutes since last activity)
                current_time = datetime.utcnow()
                active_voters_clean = {}
                
                for voter_id, voter_data in active_voters[plan_id].items():
                    last_activity = datetime.fromisoformat(voter_data['last_activity'])
                    if (current_time - last_activity).total_seconds() < 300:  # 5 minutes
                        active_voters_clean[voter_id] = voter_data
                        active_voter_ids.append(voter_id)
                    else:
                        print(f"Removing inactive voter: {voter_id}")
                
                active_voters[plan_id] = active_voters_clean
                active_voters_count = len(active_voters[plan_id])
            
            # Get completed voter IDs
            completed_voter_ids = [row[0] for row in completed_voters_result]

            # Group size is always the number of unique voters (active or completed)
            unique_voter_ids = set(active_voter_ids + completed_voter_ids)
            if len(unique_voter_ids) == 0:
                max_voters = 1  # Default to 1 if no one has joined yet
            else:
                max_voters = len(unique_voter_ids)

            # Check if ALL active voters have completed voting
            all_voters_completed = False
            if active_voters_count > 0:
                # Check if all active voters have completed voting
                all_completed = True
                for voter_id in active_voter_ids:
                    if voter_id not in completed_voter_ids:
                        all_completed = False
                        break
                all_voters_completed = all_completed
            else:
                # If no active voters, check if all voters who have voted are completed
                all_voters_completed = (max_voters > 0 and completed_voters >= max_voters)

            # Only show results when ALL active voters have completed
            voting_limit_reached = all_voters_completed

            # --- PATCH: If no active voters and completed_voters >= max_voters, mark as complete ---
            if active_voters_count == 0 and completed_voters >= max_voters:
                all_voters_completed = True
                voting_limit_reached = True
            
            print(f"📊 Voting Status for plan {plan_id}:")
            print(f"   Active voters: {active_voters_count}")
            print(f"   Completed voters: {completed_voters}")
            print(f"   Max voters: {max_voters}")
            print(f"   All completed: {all_voters_completed}")
            print(f"   Active voter IDs: {active_voter_ids}")
            print(f"   Completed voter IDs: {completed_voter_ids}")
            
            return {
                "plan_id": plan_id,
                "topic": plan["topic"],
                "group_size": plan["group_size"],
                "host_name": plan["host_name"],
                "host_phone": plan["host_phone"],
                "max_voters": max_voters,
                "completed_voters": completed_voters,
                "total_voters": total_voters,
                "active_voters": active_voters_count,
                "total_events": total_events,
                "voting_limit_reached": voting_limit_reached,
                "can_vote": not voting_limit_reached,
                "all_voters_completed": all_voters_completed
            }
            
    except Exception as e:
        print(f"Error getting voting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans/{plan_id}/results")
def get_plan_results(plan_id: str):
    try:
        print(f"🔍 Getting results for plan: {plan_id}")
        with engine.connect() as conn:
            plan_result = conn.execute(
                text("SELECT topic, group_size, zip_code, host_name, host_phone FROM plans WHERE id = :id"),
                {"id": plan_id}
            )
            plan = plan_result.fetchone()
            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")
            
            events_result = conn.execute(
                text("""
                    SELECT e.id, e.name,
                           COUNT(v.id) as total_votes,
                           COUNT(CASE WHEN v.vote_type = 'like' THEN 1 END) as likes,
                           COUNT(CASE WHEN v.vote_type = 'dislike' THEN 1 END) as dislikes
                    FROM events e
                    LEFT JOIN votes v ON e.id = v.event_id
                    WHERE e.plan_id = :plan_id
                    GROUP BY e.id, e.name
                    ORDER BY likes DESC, e.name ASC
                """),
                {"plan_id": plan_id}
            )
            events = []
            for row in events_result:
                total_votes = row[2] or 0
                likes = row[3] or 0
                dislikes = row[4] or 0
                percentage = (likes / total_votes * 100) if total_votes > 0 else 0
                event_data = {
                    "id": row[0],
                    "name": row[1],
                    "votes": likes,
                    "total_votes": total_votes,
                    "percentage": round(percentage, 1)
                }
                events.append(event_data)
                print(f"📊 Event: {row[1]}, Votes: {likes}, Total: {total_votes}")
            
            voters_result = conn.execute(
                text("SELECT DISTINCT voter_id FROM votes WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            )
            voters = [row[0] for row in voters_result]
            
            return {
                "planId": plan_id,
                "plan": {
                    "topic": plan[0],
                    "groupSize": plan[1],
                    "zipCode": plan[2],
                    "userName": plan[3],
                    "phoneNumber": plan[4]
                },
                "totalVotes": len(voters),
                "participants": voters,
                "events": events
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/votes")
def create_vote(vote: VoteCreate):
    """Create or update a vote using optimized voting system"""
    try:
        print(f"🔍 Creating vote: plan_id={vote.plan_id}, event_id={vote.event_id}, voter_id={vote.voter_id}, vote_type={vote.vote_type}")
        if not vote.voter_id or str(vote.voter_id).strip() == '' or vote.voter_id == 'None':
            print(f"❌ Invalid voter_id: {vote.voter_id}. Vote will not be saved.")
            return {"success": False, "message": "Invalid voter_id. Vote not saved."}
        with engine.connect() as conn:
            with conn.begin():
                # Check for existing vote
                existing_vote = conn.execute(
                    text("""
                        SELECT vote_type, created_at 
                        FROM votes 
                        WHERE plan_id = :plan_id AND event_id = :event_id AND voter_id = :voter_id
                    """),
                    {
                        "plan_id": vote.plan_id,
                        "event_id": vote.event_id,
                        "voter_id": vote.voter_id
                    }
                ).fetchone()
                
                if existing_vote:
                    old_vote_type = existing_vote[0]
                    # Fix timezone issue by using UTC for both
                    vote_age = datetime.utcnow() - existing_vote[1].replace(tzinfo=None)
                    
                    # Update existing vote with audit trail
                    conn.execute(
                        text("""
                            UPDATE votes 
                            SET vote_type = :vote_type, updated_at = NOW()
                            WHERE plan_id = :plan_id AND event_id = :event_id AND voter_id = :voter_id
                        """),
                        {
                            "vote_type": vote.vote_type,
                            "plan_id": vote.plan_id,
                            "event_id": vote.event_id,
                            "voter_id": vote.voter_id
                        }
                    )
                    print(f"✅ Updated existing vote for voter_id={vote.voter_id}")
                else:
                    # Create new vote
                    vote_id = str(uuid.uuid4())
                    print(f"✅ Creating new vote: {vote_id} for event {vote.event_id} by voter {vote.voter_id}")
                    conn.execute(
                        text("""
                            INSERT INTO votes (id, plan_id, event_id, voter_id, vote_type, created_at)
                            VALUES (:id, :plan_id, :event_id, :voter_id, :vote_type, NOW())
                        """),
                        {
                            "id": vote_id,
                            "plan_id": vote.plan_id,
                            "event_id": vote.event_id,
                            "voter_id": vote.voter_id,
                            "vote_type": vote.vote_type
                        }
                    )
                    print(f"✅ Vote saved for voter_id={vote.voter_id}")
                # Update voter participation with audit timestamps
                conn.execute(
                    text("""
                        INSERT INTO voter_participation (id, plan_id, voter_id, events_voted_on, first_vote_at, last_vote_at)
                        VALUES (:id, :plan_id, :voter_id, 1, NOW(), NOW())
                        ON CONFLICT (plan_id, voter_id) 
                        DO UPDATE SET 
                            events_voted_on = voter_participation.events_voted_on + 1,
                            last_vote_at = NOW(),
                            updated_at = NOW()
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "plan_id": vote.plan_id,
                        "voter_id": vote.voter_id
                    }
                )
            return {"success": True, "message": "Vote recorded with audit trail"}
    except Exception as e:
        print(f"❌ Error creating vote: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reservations")
def create_reservation(reservation: ReservationCreate):
    try:
        reservation_id = f"RES-{int(datetime.now().timestamp())}-{secrets.token_hex(4)}"
        confirmation_number = f"CNF-{secrets.token_hex(3).upper()}"
        
        providers = {
            "concerts": {"name": "TicketMaster", "requires_confirmation": True},
            "nightlife": {"name": "OpenTable", "requires_confirmation": False},
            "foodie": {"name": "OpenTable", "requires_confirmation": False},
            "datenight": {"name": "Resy", "requires_confirmation": True},
            "sports": {"name": "StubHub", "requires_confirmation": True},
            "parks": {"name": "Recreation.gov", "requires_confirmation": False},
            "gokart": {"name": "GoKart Pro", "requires_confirmation": True},
            "swimming": {"name": "PoolPass", "requires_confirmation": False},
            "drinks": {"name": "BarTab", "requires_confirmation": False}
        }
        
        provider = providers.get(reservation.activity_type, {"name": "Generic", "requires_confirmation": False})
        
        import time
        time.sleep(1)
        
        return {
            "reservationId": reservation_id,
            "confirmationNumber": confirmation_number,
            "provider": provider["name"],
            "eventName": reservation.event_name,
            "userName": reservation.user_name,
            "phoneNumber": reservation.phone_number,
            "groupSize": reservation.group_size,
            "eventTime": reservation.event_time,
            "eventDate": reservation.event_date or datetime.now().strftime("%Y-%m-%d"),
            "status": "pending" if provider["requires_confirmation"] else "confirmed",
            "requiresConfirmation": provider["requires_confirmation"],
            "message": (
                f"Reservation submitted to {provider['name']}. You'll receive a confirmation call within 15 minutes."
                if provider["requires_confirmation"]
                else f"Reservation confirmed with {provider['name']}! Confirmation #{confirmation_number}"
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users")
def create_user(user: UserCreate):
    try:
        user_id = str(uuid.uuid4())
        with engine.connect() as conn:
            existing_user = conn.execute(
                text("SELECT id FROM users WHERE phone = :phone"),
                {"phone": user.phone}
            ).fetchone()
            
            if existing_user:
                return {"id": existing_user[0], "message": "User already exists"}
            
            conn.execute(
                text("""
                    INSERT INTO users (id, name, phone, created_at)
                    VALUES (:id, :name, :phone, NOW())
                """),
                {
                    "id": user_id,
                    "name": user.name,
                    "phone": user.phone
                }
            )
            
            conn.commit()
            return {"id": user_id, "message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Legacy login endpoint - redirects to new auth system
    """
    raise HTTPException(
        status_code=400,
        detail="Please use /api/auth/send-code and /api/auth/verify-code for authentication"
    )


@app.get("/users/me")
def get_my_user(current_user_id: str = Depends(get_current_user)):
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, name FROM users WHERE id = :id"),
                {"id": current_user_id}
            )
            user = result.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return {"id": user[0], "name": user[1]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/count")
def get_users_count():
    """Get total number of users (for admin purposes)"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            return {"total_users": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoint (for development only - remove in production)
@app.get("/admin/users")
def get_all_users():
    """Get all users (ADMIN ONLY - remove in production)"""
    # Check if we're in development mode
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, name FROM users LIMIT 10"))
            users = [{"id": row[0], "name": row[1]} for row in result]
            return {"users": users, "warning": "This endpoint should be removed in production"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/cleanup/old-votes")
def cleanup_old_votes():
    """Clean up votes older than 30 days (for audit optimization)"""
    try:
        with engine.connect() as conn:
            # Archive old votes to audit_log before deletion
            archived_count = conn.execute(
                text("""
                    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, created_at)
                    SELECT 
                        'votes' as table_name,
                        v.id as record_id,
                        'DELETE' as action,
                        jsonb_build_object(
                            'plan_id', v.plan_id,
                            'event_id', v.event_id,
                            'voter_id', v.voter_id,
                            'vote_type', v.vote_type,
                            'created_at', v.created_at
                        ) as old_values,
                        NULL as new_values,
                        NOW() as created_at
                    FROM votes v
                    WHERE v.created_at < NOW() - INTERVAL '30 days'
                """)
            ).rowcount
            
            # Delete old votes
            deleted_count = conn.execute(
                text("DELETE FROM votes WHERE created_at < NOW() - INTERVAL '30 days'")
            ).rowcount
            
            conn.commit()
            
            return {
                "message": "Cleanup completed",
                "archived_votes": archived_count,
                "deleted_votes": deleted_count
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/analytics/vote-patterns")
def get_vote_analytics():
    """Get voting analytics for fraud detection and engagement"""
    try:
        with engine.connect() as conn:
            # Recent vote activity
            recent_votes = conn.execute(
                text("""
                    SELECT 
                        DATE(created_at) as vote_date,
                        COUNT(*) as total_votes,
                        COUNT(CASE WHEN vote_type = 'like' THEN 1 END) as likes,
                        COUNT(CASE WHEN vote_type = 'dislike' THEN 1 END) as dislikes
                    FROM votes 
                    WHERE created_at > NOW() - INTERVAL '7 days'
                    GROUP BY DATE(created_at)
                    ORDER BY vote_date DESC
                """)
            ).fetchall()
            
            # Voter participation rates
            participation = conn.execute(
                text("""
                    SELECT 
                        plan_id,
                        COUNT(DISTINCT voter_id) as unique_voters,
                        AVG(events_voted_on) as avg_engagement
                    FROM voter_participation
                    WHERE updated_at > NOW() - INTERVAL '7 days'
                    GROUP BY plan_id
                    ORDER BY avg_engagement DESC
                """)
            ).fetchall()
            
            return {
                "recent_vote_activity": [
                    {
                        "date": str(row[0]),
                        "total_votes": row[1],
                        "likes": row[2],
                        "dislikes": row[3]
                    }
                    for row in recent_votes
                ],
                "participation_rates": [
                    {
                        "plan_id": row[0],
                        "unique_voters": row[1],
                        "avg_engagement": float(row[2]) if row[2] else 0
                    }
                    for row in participation
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/optimize/events")
def optimize_events():
    """Optimize event storage (deduplicate, cache, archive)"""
    try:
        # Import here to avoid circular imports
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        from event_optimization import EventOptimizationSystem
        
        optimizer = EventOptimizationSystem()
        results = optimizer.optimize_event_storage()
        
        return {
            "message": "Event optimization completed",
            "results": results
        }
    except Exception as e:
        print(f"Error in optimize_events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/analytics/event-stats")
def get_event_statistics():
    """Get event storage statistics"""
    # Check if we're in development mode
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    try:
        # Import here to avoid circular imports
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        from event_optimization import EventOptimizationSystem
        
        optimizer = EventOptimizationSystem()
        stats = optimizer.get_event_statistics()
        
        return stats
    except Exception as e:
        logger.error(f"Error in get_event_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/db/pool-status")
def get_db_pool_status():
    """Get database connection pool status"""
    # Check if we're in development mode
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    try:
        pool = engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "invalid": pool.invalid()
        }
    except Exception as e:
        logger.error(f"Error getting pool status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events/trending")
@cached(ttl=300, key_prefix="trending")  # Cache for 5 minutes
async def get_trending_events(zip: str = Query(..., description="ZIP code to get trending events for")):
    """Get trending events for a specific ZIP code area with caching"""
    try:
        # Check cache first
        cache_key = f"trending_events:{zip}"
        cached_result = cache_manager.get(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for trending events: {zip}")
            return cached_result
        
        # Get location data for the ZIP code
        coordinates = await geocoding_service.get_coordinates_from_zipcode(zip)
        if not coordinates:
            logger.warning(f"Invalid ZIP code provided: {zip}")
            raise HTTPException(status_code=400, detail="Invalid ZIP code")
        
        lat, lng = coordinates
        
        # Get events from our database for this area
        with SessionLocal() as db:
            try:
                # Find events near this ZIP code with highest vote counts
                trending_events = db.execute(text("""
                    SELECT e.*, 
                           COUNT(v.id) as vote_count
                    FROM events e
                    LEFT JOIN votes v ON e.id = v.event_id
                    WHERE e.zip_code = :zip
                    GROUP BY e.id
                    ORDER BY vote_count DESC
                    LIMIT 5
                """), {"zip": zip}).fetchall()
                
                if trending_events:
                    # Get the most popular event
                    top_event = trending_events[0]
                    result = {
                        "event": {
                            "id": top_event[0],
                            "name": top_event[1],
                            "description": top_event[2] or "Popular local event",
                            "category": top_event[3] or "Local",
                            "votes": top_event[4] or 0,
                            "rating": 4.0,  # Default rating since we removed the rating column
                            "image": top_event[6] or "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
                        },
                        "total_events_found": len(trending_events),
                        "zip_code": zip
                    }
                    # Cache the result
                    cache_manager.set(cache_key, result, ttl=300)
                    return result
            except Exception as db_error:
                logger.error(f"Database error in trending events: {db_error}")
                # Continue to external API fallback
        
        # If no local events, try external APIs
        try:
            external_events = await location_service.get_events(
                lat=lat, 
                lng=lng, 
                category="entertainment", 
                radius=10000, 
                limit=5
            )
            
            if external_events:
                # Return the first external event as trending
                event = external_events[0]
                result = {
                    "event": {
                        "id": f"ext_{event.get('id', 'unknown')}",
                        "name": event.get('name', 'Local Event'),
                        "description": event.get('description', 'Popular event in your area'),
                        "category": event.get('category', 'Entertainment'),
                        "votes": int(event.get('rating', 4.0) * 10),  # Convert rating to vote-like metric
                        "rating": event.get('rating', 4.0),
                        "image": event.get('image', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop')
                    },
                    "total_events_found": len(external_events),
                    "zip_code": zip
                }
                # Cache the result
                # cache_manager.set(cache_key, result, ttl=300)
                return result
        except Exception as e:
            logger.warning(f"Failed to get external events: {e}")
        
        # No events found - return a default response instead of 404
        logger.info(f"No trending events found for ZIP: {zip}")
        result = {
            "event": {
                "id": "default_trending",
                "name": "Local Favorites",
                "description": "Check back soon for trending events in your area!",
                "category": "Local",
                "votes": 0,
                "rating": 4.0,
                "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            },
            "total_events_found": 0,
            "zip_code": zip,
            "message": "No trending events available yet"
        }
        # Cache the default result for a shorter time
        # cache_manager.set(cache_key, result, ttl=60)
        return result
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trending events: {e}")
        # Return a default response instead of 500 error
        return {
            "event": {
                "id": "error_fallback",
                "name": "Local Events",
                "description": "Discover what's happening in your area",
                "category": "Local",
                "votes": 0,
                "rating": 4.0,
                "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            },
            "total_events_found": 0,
            "zip_code": zip,
            "message": "Service temporarily unavailable"
        }

@app.get("/api/config/status")
async def get_api_config_status():
    """Get API configuration status and topic information"""
    validation = api_template_manager.validate_configuration()
    
    # Get all topics with their configurations
    topics = []
    for topic_config in api_template_manager.get_all_topics():
        topics.append({
            'key': topic_config.key,
            'label': topic_config.label,
            'icon': topic_config.icon,
            'description': topic_config.description,
            'event_type': topic_config.event_type.value,
            'api_sources': topic_config.api_sources,
            'api_count': len(topic_config.api_sources),
            'min_events_threshold': topic_config.min_events_threshold,
            'fallback_activities': topic_config.fallback_activities
        })
    
    # Get API status
    apis = []
    for api_name, api_config in api_template_manager.api_configs.items():
        apis.append({
            'name': api_name,
            'enabled': api_config.enabled,
            'priority': api_config.priority,
            'rate_limit': api_config.rate_limit,
            'has_key_env': bool(api_config.api_key_env),
            'base_url': api_config.base_url
        })
    
    return {
        'valid': validation['valid'],
        'errors': validation['errors'],
        'warnings': validation['warnings'],
        'topics': topics,
        'apis': apis,
        'total_topics': len(topics),
        'total_apis': len(apis),
        'enabled_apis': len([api for api in apis if api['enabled']])
    }

# In-memory storage for active voters (in production, use Redis)
active_voters = {}

@app.post("/api/plans/{plan_id}/active-voters")
def update_active_voter(plan_id: str, voter_data: dict):
    """Update active voter status"""
    try:
        voter_id = voter_data.get('voter_id')
        voter_name = voter_data.get('name')
        action = voter_data.get('action', 'join')  # 'join' or 'leave'
        
        if not plan_id in active_voters:
            active_voters[plan_id] = {}
        
        if action == 'join':
            # Check if voter already exists
            if voter_id in active_voters[plan_id]:
                # Update existing voter's activity timestamp
                active_voters[plan_id][voter_id]['last_activity'] = datetime.utcnow().isoformat()
                print(f"🔄 Updated existing voter: {voter_name} ({voter_id})")
            else:
                # Add new voter
                active_voters[plan_id][voter_id] = {
                    'name': voter_name,
                    'joined_at': datetime.utcnow().isoformat(),
                    'last_activity': datetime.utcnow().isoformat()
                }
                print(f"✅ Added new voter: {voter_name} ({voter_id})")
        elif action == 'leave':
            if voter_id in active_voters[plan_id]:
                del active_voters[plan_id][voter_id]
                print(f"👋 Removed voter: {voter_name} ({voter_id})")
        
        print(f"📊 Total active voters for plan {plan_id}: {len(active_voters[plan_id])}")
        return {"success": True, "active_voters": len(active_voters[plan_id])}
    except Exception as e:
        print(f"❌ Error in update_active_voter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans/{plan_id}/active-voters")
def get_active_voters(plan_id: str):
    """Get active voters for a plan"""
    try:
        if plan_id not in active_voters:
            return {"active_voters": []}
        
        # Clean up inactive voters (more than 5 minutes since last activity)
        current_time = datetime.utcnow()
        active_voters_clean = {}
        
        for voter_id, voter_data in active_voters[plan_id].items():
            last_activity = datetime.fromisoformat(voter_data['last_activity'])
            if (current_time - last_activity).total_seconds() < 300:  # 5 minutes
                active_voters_clean[voter_id] = voter_data
            else:
                print(f"Removing inactive voter: {voter_id}")
        
        active_voters[plan_id] = active_voters_clean
        
        # Convert to list format for frontend
        voters_list = []
        for voter_id, voter_data in active_voters[plan_id].items():
            joined_time = datetime.fromisoformat(voter_data['joined_at'])
            time_elapsed = (current_time - joined_time).total_seconds()
            time_remaining = max(0, 300 - time_elapsed)  # 5 minutes total
            
            voters_list.append({
                'voter_id': voter_id,
                'name': voter_data['name'],
                'time_remaining': int(time_remaining),
                'joined_at': voter_data['joined_at']
            })
        
        return {"active_voters": voters_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/config/topics")
async def get_topics():
    """Get all available topics"""
    topics = []
    for topic_config in api_template_manager.get_all_topics():
        topics.append({
            'key': topic_config.key,
            'label': topic_config.label,
            'icon': topic_config.icon,
            'description': topic_config.description
        })
    return {'topics': topics}

@app.post("/api/auth/send-code")
@monitor_performance
async def send_verification_code(phone: str):
    """Send verification code to phone number"""
    try:
        # Validate phone number
        validated_phone = InputValidator.validate_phone_number(phone)
        
        # Create verification session
        session_id = SessionManager.create_verification_session(validated_phone)
        
        # Log security event
        log_security_event("verification_code_sent", {"phone": validated_phone})
        
        return {
            "success": True,
            "session_id": session_id,
            "message": "Verification code sent"
        }
    except Exception as e:
        logger.error(f"Error sending verification code: {e}")
        if isinstance(e, ValidationError):
            raise ErrorHandler.handle_validation_error(e)
        raise HTTPException(status_code=500, detail="Failed to send verification code")

@app.post("/api/auth/verify-code")
@monitor_performance
async def verify_code(session_data: dict):
    """Verify SMS code and return access token"""
    try:
        # Validate session data
        validated_data = InputValidator.validate_session_data(session_data)
        
        # Verify the code
        code_valid = SessionManager.verify_session_code(validated_data["session_id"], validated_data["code"])
        phone = SessionManager.get_session_phone(validated_data["session_id"])
        if not code_valid or not phone:
            log_security_event("auth_failed", {"reason": "invalid_code", "session_id": validated_data["session_id"]})
            raise ErrorHandler.handle_validation_error(ValidationError("code", "Invalid or expired verification code"))
        
        # Get phone from session
        phone = SessionManager.get_session_phone(validated_data["session_id"])
        if not phone:
            raise ErrorHandler.handle_validation_error(ValidationError("session_id", "Invalid or expired verification code"))
        
        # Check if user exists, create if not
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, name FROM users WHERE phone = :phone"),
                {"phone": phone}
            )
            user = result.fetchone()
            
            if not user:
                # Create new user with default name
                user_id = str(uuid.uuid4())
                default_name = f"User{phone[-4:]}"  # Use last 4 digits as default name
                
                conn.execute(
                    text("""
                        INSERT INTO users (id, phone, name, created_at, updated_at)
                        VALUES (:id, :phone, :name, NOW(), NOW())
                    """),
                    {"id": user_id, "phone": phone, "name": default_name}
                )
                conn.commit()
                
                user = (user_id, default_name)
                log_user_action(user_id, "user_created", {"phone": phone, "name": default_name})
            else:
                user = (str(user[0]), user[1])
            
            # Create access token
            access_token = AuthSystem.create_access_token(user[0], phone)
            refresh_token = AuthSystem.create_refresh_token(user[0])
            
            # Log successful authentication
            log_user_action(user[0], "user_login", {"phone": phone})
            log_security_event("auth_success", {"user_id": user[0], "phone": phone})
            
            return {
                "success": True,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_id": user[0],
                "user_name": user[1],
                "phone": phone
            }
    except Exception as e:
        logger.error(f"Error verifying code: {e}")
        if isinstance(e, ValidationError):
            raise ErrorHandler.handle_validation_error(e)
        # If the error message is empty, raise a default validation error
        raise ErrorHandler.handle_validation_error(ValidationError("code", "Invalid or expired verification code"))

@app.post("/api/auth/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token using refresh token"""
    try:
        payload = AuthSystem.verify_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid token")
        
        # Get user phone for new access token
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT phone FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            )
            user = result.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Create new access token
            access_token = AuthSystem.create_access_token(user_id, user[0])
            
            return {
                "success": True,
                "access_token": access_token
            }
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh token")

# Input validation is now handled by utils.validation module

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 