"""
Choosy Core API Server
Copyright (c) 2024 rtavarezz

Main application server for group decision-making platform.
Licensed under MIT License - see LICENSE file.

This proprietary system handles event discovery, voting mechanics,
and real-time group coordination for activity planning.
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from jose import JWTError
from datetime import datetime, timezone
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
from services.geocoding_service import geocoding_service
from services.api_config import api_template_manager
from core.cache_manager import cached, cache_manager
from core.db import engine
from utils.validation import ValidationError
from core.user_endpoints import router as user_router
from core.auth_system import AuthSystem
from utils.validation import InputValidator, ErrorHandler
from utils.monitoring import (
    setup_monitoring, get_health_status, monitor_performance, 
    start_periodic_monitoring
)

# Import rate limiter
from core.rate_limiter import rate_limiter, get_client_id

# Import logger
from utils.logger import logger, log_api_request, log_error

# Global in-memory store for active voters (per process)
active_voters = {}

# Name validation function
def validate_name(name: str) -> bool:
    """
    Validates user names to ensure they meet community standards and safety requirements.
    
    This function performs comprehensive validation including:
    - Basic format checking (length, character types)
    - Content filtering (profanity, system names, spam patterns)
    - Security checks (prevent injection attacks, bot detection)
    
    Args:
        name (str): The name to validate
        
    Returns:
        bool: True if name passes all validation checks, False otherwise
    """
    # Basic null and type checking - prevent empty or invalid input
    if not name or not isinstance(name, str):
        return False
    
    trimmed_name = name.strip()
    
    # Enforce reasonable length limits to prevent database issues and ensure readability
    if len(trimmed_name) < 2 or len(trimmed_name) > 30:
        return False
    
    # Allow only safe characters: letters, spaces, hyphens, and apostrophes
    # This prevents SQL injection and XSS attacks through name fields
    if not re.match(r'^[a-zA-Z\s\-\']+$', trimmed_name):
        return False
    
    # Block common system and test account names to maintain platform integrity
    system_words = [
        'admin', 'moderator', 'system', 'test', 'fake', 'spam', 'bot', 'robot',
        'anonymous', 'anon', 'unknown', 'nobody', 'someone', 'anyone', 'everyone'
    ]
    
    lower_name = trimmed_name.lower()
    for word in system_words:
        if word in lower_name:
            return False
    
    # Apply comprehensive profanity filtering to maintain community standards
    if profanity.contains_profanity(trimmed_name):
        return False
    
    # Detect spam patterns - excessive character repetition (like "aaaaaa")
    if re.search(r'(.)\1{4,}', trimmed_name):
        return False
    
    # Prevent double spaces which could indicate formatting manipulation
    if '  ' in trimmed_name:
        return False
    
    return True

# Environment configuration is now handled by centralized config
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
        print(f"🎯 DEBUG: get_events called with category='{category}', lat={lat}, lng={lng}")
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
            # Tickets flag: Eventbrite/Ticketmaster with external_url implies ticket purchase
            tickets_required = True if (event.external_url and (event.source and event.source.value in ["eventbrite", "ticketmaster"])) else False
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
                'metadata': event.metadata,
                'tickets_required': tickets_required
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
                    INSERT INTO plans (id, topic, group_size, zip_code, host_name, host_phone, created_at)
                    VALUES (:id, :topic, :group_size, :zip_code, :host_name, :host_phone, CURRENT_TIMESTAMP)
                """),
                {
                    "id": plan_id,
                    "topic": validated_data.get("title", validated_data.get("topic", "nightlife")),  # Use title as topic, fallback to nightlife
                    "group_size": validated_data["group_size"],
                    "zip_code": validated_data["zip_code"],
                    "host_name": validated_data.get("userName", validated_data.get("name", "Host")),
                    "host_phone": validated_data.get("phoneNumber", validated_data.get("phone", "+1234567890"))
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

@app.post("/api/plans/simple")
def create_plan_simple(plan_data: dict):
    """Create a new plan without authentication (for onboarding flow)"""
    try:
        print(f"🎯 Creating simple plan with data: {plan_data}")
        
        # Extract and validate data
        topic = plan_data.get("title", plan_data.get("topic", "nightlife"))
        group_size = plan_data.get("groupSize", plan_data.get("group_size", "myself"))
        zip_code = plan_data.get("zipCode", plan_data.get("zip_code", "10001"))
        host_name = plan_data.get("userName", plan_data.get("name", "Host"))
        host_phone = plan_data.get("phoneNumber", plan_data.get("phone", "+1234567890"))
        
        # Validate topic is in allowed list
        allowed_topics = ['concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family', 'bored']
        if topic not in allowed_topics:
            print(f"⚠️ Invalid topic '{topic}', defaulting to 'nightlife'")
            topic = "nightlife"
        
        plan_id = str(uuid.uuid4())
        
        with engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO plans (id, topic, group_size, zip_code, host_name, host_phone)
                    VALUES (:id, :topic, :group_size, :zip_code, :host_name, :host_phone)
                """),
                {
                    "id": plan_id,
                    "topic": topic,
                    "group_size": group_size,
                    "zip_code": zip_code,
                    "host_name": host_name,
                    "host_phone": host_phone
                }
            )
            conn.commit()
        
        print(f"✅ Created plan {plan_id} with topic '{topic}'")
        
        return {
            "success": True,
            "plan_id": plan_id,
            "planId": plan_id,  # Alternative key for compatibility
            "id": plan_id,      # Alternative key for compatibility
            "message": "Plan created successfully"
        }
    except Exception as e:
        print(f"❌ Error creating simple plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create plan: {str(e)}")

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
    """Replace all events for a plan with new events"""
    try:
        with engine.connect() as conn:
            # First, verify the plan exists
            plan_result = conn.execute(
                text("SELECT id FROM plans WHERE id = :id"),
                {"id": plan_id}
            )
            if not plan_result.fetchone():
                raise HTTPException(status_code=404, detail="Plan not found")
            
            # DELETE existing events for this plan
            delete_result = conn.execute(
                text("DELETE FROM events WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            )
            deleted_count = delete_result.rowcount
            print(f"🗑️ Deleted {deleted_count} existing events for plan {plan_id}")
            
            # INSERT new events
            created_count = 0
            for event in events:
                event_id = str(uuid.uuid4())
                # Map incoming source to DB constraint values
                raw_source = (event.get("source") or event.get("source_type") or "").lower()
                if raw_source in ("eventbrite", "ticketmaster", "yelp", "custom", "google", "local"):
                    source_type = raw_source
                elif raw_source in ("google_places", "openstreetmap", "osm", "places"):
                    source_type = "google"
                elif raw_source in ("meetup",):
                    source_type = "local"
                elif not raw_source:
                    source_type = "local"
                else:
                    source_type = "local"
                conn.execute(
                    text("""
                        INSERT INTO events (id, plan_id, name, image, hours, source_type, votes_count, metadata)
                        VALUES (:id, :plan_id, :name, :image, :hours, :source_type, 0, :metadata)
                    """),
                    {
                        "id": event_id,
                        "plan_id": plan_id,
                        "name": event.get("name", "Event"),
                        "image": event.get("image_url") or event.get("image"),  # Support both field names
                        "hours": event.get("hours"),
                        "source_type": source_type,
                        "metadata": json.dumps(event.get("metadata", {}))
                    }
                )
                created_count += 1
            
            conn.commit()
            print(f"✅ Replaced {deleted_count} events with {created_count} new events for plan {plan_id}")
            return {"message": f"Replaced events for plan {plan_id}: deleted {deleted_count}, created {created_count}"}
    except Exception as e:
        print(f"❌ Error replacing events for plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans/{plan_id}")
def get_plan_details(plan_id: str):
    """Get basic plan information"""
    try:
        with engine.connect() as conn:
            plan_result = conn.execute(
                text("SELECT id, topic, group_size, zip_code, host_name, host_phone, created_at FROM plans WHERE id = :id"),
                {"id": plan_id}
            )
            plan_row = plan_result.fetchone()
            if not plan_row:
                raise HTTPException(status_code=404, detail="Plan not found")
            
            return {
                "id": plan_row[0],
                "topic": plan_row[1],
                "group_size": plan_row[2],
                "zip_code": plan_row[3],
                "host_name": plan_row[4],
                "host_phone": plan_row[5],
                "created_at": plan_row[6].isoformat() if plan_row[6] else None
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans/{plan_id}/events")
def get_events_for_plan(plan_id: str):
    try:
        from services.unsplash_service import get_unsplash_fallback
        with engine.connect() as conn:
            # Get plan details including topic
            plan_result = conn.execute(
                text("SELECT id, topic, group_size, zip_code, host_name, host_phone FROM plans WHERE id = :id"),
                {"id": plan_id}
            )
            plan_row = plan_result.fetchone()
            if not plan_row:
                raise HTTPException(status_code=404, detail="Plan not found")
            plan_topic = plan_row[1] if plan_row else 'nightlife'
            print(f"🎯 Plan details: ID={plan_row[0]}, Topic={plan_topic}, Group={plan_row[2]}")
            # Debug: Check if this plan has any events
            event_count_result = conn.execute(
                text("SELECT COUNT(*) FROM events WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            )
            event_count = event_count_result.fetchone()[0]
            print(f"🎯 Total events in database for plan {plan_id}: {event_count}")
            events_result = conn.execute(
                text("""
                    SELECT id, name, image, hours, source_type, votes_count, metadata
                    FROM events 
                    WHERE plan_id = :plan_id
                    ORDER BY votes_count DESC, name ASC
                """),
                {"plan_id": plan_id}
            )
            print(f"🎯 Found {events_result.rowcount} events for plan {plan_id}")
            events = []
            for row in events_result:
                metadata = {}
                if row[6] and row[6] != '{}':
                    try:
                        if isinstance(row[6], str):
                            metadata = json.loads(row[6])
                        else:
                            metadata = row[6]
                    except (json.JSONDecodeError, TypeError):
                        metadata = {}
                # Use event image if present, else fallback to Unsplash
                image_url = row[2] or metadata.get('image_url')
                unsplash_attribution = None
                if not image_url:
                    unsplash = get_unsplash_fallback(plan_topic, event_id=str(row[0]))
                    if unsplash:
                        image_url = unsplash.get('image_url')
                        unsplash_attribution = unsplash.get('attribution_html')
                # If still no image, fallback to old topic image
                if not image_url:
                    topic_image_map = {
                        'concerts': 'music',
                        'nightlife': 'nightlife',
                        'foodie': 'food',
                        'datenight': 'romance',
                        'sports': 'sports',
                        'parks': 'nature',
                        'racing': 'cars',
                        'swimming': 'sports',
                        'drinks': 'bar',
                        'movies': 'cinema',
                        'comedy': 'entertainment',
                        'art': 'art',
                        'shopping': 'shopping',
                        'wellness': 'spa',
                        'adventure': 'adventure',
                        'family': 'family'
                    }
                    image_category = topic_image_map.get(plan_topic, 'nightlife')
                    image_url = f"https://picsum.photos/600/400?random={str(row[0])[-6:]}&category={image_category}"
                event_data = {
                    "id": row[0],
                    "name": row[1],
                    "image_url": image_url,
                    "hours": row[3] or metadata.get('hours', 'Hours not available'),
                    "source_type": row[4],
                    "votes_count": row[5] or 0,
                    "metadata": metadata,
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
                    "tickets_required": bool(metadata.get('tickets_required')),
                    "reservations_accepted": bool(metadata.get('reservations_accepted')),
                    "reviews": {
                        "count": metadata.get('review_count', metadata.get('user_ratings_total', 42)),
                        "stars": metadata.get('rating', metadata.get('stars', 4.2))
                    },
                    "topic": metadata.get('topic', plan_topic),
                    "contact": {
                        "phone": metadata.get('phone', '+1 212-997-4144'),
                    },
                }
                if unsplash_attribution:
                    event_data["unsplash_attribution"] = unsplash_attribution
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
            
            # Get active voters count from Redis cache
            active_voters_count = 0
            active_voter_ids = []
            
            try:
                # Get active voters from Redis with TTL-based cleanup
                redis_key = f"active_voters:{plan_id}"
                active_voters_data = cache_manager.get(redis_key)
                
                if active_voters_data:
                    current_time = datetime.now(timezone.utc)
                    active_voters_clean = {}
                    
                    for voter_id, voter_data in active_voters_data.items():
                        try:
                            # Handle timezone-aware datetime parsing
                            last_activity_str = voter_data['last_activity']
                            if 'T' in last_activity_str and '+' in last_activity_str:
                                # ISO format with timezone
                                last_activity = datetime.fromisoformat(last_activity_str)
                            else:
                                # UTC format without timezone - treat as UTC
                                last_activity = datetime.fromisoformat(last_activity_str).replace(tzinfo=timezone.utc)
                            
                            # Check if voter is still active (within 5 minutes)
                            # Ensure both timestamps are timezone-aware for proper comparison
                            if last_activity.tzinfo is None:
                                last_activity = last_activity.replace(tzinfo=timezone.utc)
                            if (current_time - last_activity).total_seconds() < 300:
                                active_voters_clean[voter_id] = voter_data
                                active_voter_ids.append(voter_id)
                            else:
                                print(f"Removing inactive voter: {voter_id}")
                        except Exception as e:
                            print(f"Error parsing last_activity for voter {voter_id}: {e}")
                            continue
                    
                    # Filter out voters who have already completed all events
                    completed_voter_ids = [row[0] for row in completed_voters_result]
                    active_voters_filtered = {}
                    for voter_id, voter_data in active_voters_clean.items():
                        if voter_id not in completed_voter_ids:
                            active_voters_filtered[voter_id] = voter_data
                            if voter_id not in active_voter_ids:
                                active_voter_ids.append(voter_id)
                    
                    # Update Redis with cleaned data
                    if active_voters_filtered:
                        cache_manager.set(redis_key, active_voters_filtered, ttl=600)  # 10 minute TTL
                    else:
                        cache_manager.delete(redis_key)
                    
                    active_voters_count = len(active_voters_filtered)
                else:
                    active_voters_count = 0
                    
            except Exception as e:
                print(f"Redis error in voting status: {e}")
                # Fallback to in-memory if Redis fails
                if plan_id in active_voters:
                    active_voters_count = len(active_voters[plan_id])
                    active_voter_ids = list(active_voters[plan_id].keys())
            
            # Get completed voter IDs
            completed_voter_ids = [row[0] for row in completed_voters_result]

            # Get registered participants (friends who joined but may not have voted yet)
            participants_result = conn.execute(
                text("SELECT DISTINCT voter_id FROM voter_participation WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchall()
            participant_ids = [row[0] for row in participants_result]

            # active_voter_ids and active_voters_count are already set above from Redis

            # Smart voter counting logic:
            # 1. Count people who have voted (completed or in progress)
            # 2. Count people actively voting (in Redis)
            # 3. Count recent participants (joined in last 10 minutes and might be voting)
            
            actual_voter_ids = set()
            
            # Add voters who have cast at least 1 vote
            for row in conn.execute(text("SELECT DISTINCT voter_id FROM votes WHERE plan_id = :plan_id"), {"plan_id": plan_id}).fetchall():
                actual_voter_ids.add(row[0])
            
            # Add currently active voters (in Redis)
            actual_voter_ids.update(active_voter_ids)
            
            # Add recent participants (joined in last 10 minutes) - they might be about to vote
            recent_participants = conn.execute(
                text("""
                    SELECT DISTINCT voter_id FROM voter_participation 
                    WHERE plan_id = :plan_id 
                    AND created_at > datetime('now', '-10 minutes')
                """),
                {"plan_id": plan_id}
            ).fetchall()
            
            for row in recent_participants:
                actual_voter_ids.add(row[0])
            
            # Always include the creator if this is a shared plan (has participants)
            if participant_ids:  # If anyone has joined, include creator
                creator_id = f"host_{plan_id}"
                actual_voter_ids.add(creator_id)
            
            # Default to 1 if no activity yet (solo plan)
            max_voters = len(actual_voter_ids) if actual_voter_ids else 1

            # Fix all_voters_completed logic
            all_voters_completed = False
            if active_voters_count > 0:
                all_voters_completed = all(voter_id in completed_voter_ids for voter_id in active_voter_ids)
            else:
                all_voters_completed = (max_voters > 0 and completed_voters >= max_voters)
            voting_limit_reached = all_voters_completed
            
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
                    SELECT e.id, e.name, e.image, e.source_type, e.metadata,
                           COUNT(v.id) as total_votes,
                           COUNT(CASE WHEN v.vote_type = 'like' THEN 1 END) as likes,
                           COUNT(CASE WHEN v.vote_type = 'dislike' THEN 1 END) as dislikes
                    FROM events e
                    LEFT JOIN votes v ON e.id = v.event_id
                    WHERE e.plan_id = :plan_id
                    GROUP BY e.id, e.name, e.image, e.source_type, e.metadata
                    ORDER BY likes DESC, e.name ASC
                """),
                {"plan_id": plan_id}
            )
            events = []
            for row in events_result:
                total_votes = row[5] or 0
                likes = row[6] or 0
                dislikes = row[7] or 0
                percentage = (likes / total_votes * 100) if total_votes > 0 else 0
                
                # Parse metadata for additional info
                metadata = {}
                if row[4]:
                    try:
                        if isinstance(row[4], str):
                            metadata = json.loads(row[4])
                        else:
                            metadata = row[4]
                    except:
                        metadata = {}
                
                # Get topic-specific image fallback
                topic_image_map = {
                    'concerts': 'music',
                    'nightlife': 'nightlife', 
                    'foodie': 'food',
                    'datenight': 'romance',
                    'sports': 'sports',
                    'parks': 'nature',
                    'racing': 'cars',
                    'swimming': 'sports',
                    'drinks': 'bar',
                    'movies': 'cinema',
                    'comedy': 'entertainment',
                    'art': 'art',
                    'shopping': 'shopping',
                    'wellness': 'spa',
                    'adventure': 'adventure',
                    'family': 'family'
                }
                
                image_category = topic_image_map.get(plan[0] if plan else 'nightlife', 'nightlife')
                topic_specific_image = f"https://picsum.photos/600/400?random={str(row[0])[-6:]}&category={image_category}"
                
                # Extract ticketing/reservation info from metadata when present
                tickets_required = bool(metadata.get('tickets_required'))
                reservations_accepted = bool(metadata.get('reservations_accepted'))
                external_url = metadata.get('external_url') or metadata.get('purchase_url')
                seatmap_url = metadata.get('seatmap_url')

                event_data = {
                    "id": str(row[0]),
                    "name": row[1],
                    "image_url": row[2] or metadata.get('image_url') or topic_specific_image,  # Changed to image_url
                    "source_type": row[3],
                    "votes": likes,
                    "total_votes": total_votes,
                    "percentage": round(percentage, 1),
                    "tickets_required": tickets_required,
                    "reservations_accepted": reservations_accepted,
                    "external_url": external_url,
                    "seatmap_url": seatmap_url,
                    "metadata": metadata
                }
                events.append(event_data)
                print(f"📊 Event: {row[1]}, Votes: {likes}, Total: {total_votes}")
            
            voters_result = conn.execute(
                text("SELECT DISTINCT voter_id FROM votes WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            )
            voters = [row[0] for row in voters_result]
            
            return {
                "planId": plan_id,  # Keep this for backwards compatibility
                "plan": {
                    "topic": plan[0],
                    "group_size": plan[1],       # Changed from groupSize to group_size
                    "zip_code": plan[2],         # Changed from zipCode to zip_code  
                    "host_name": plan[3],        # Changed from userName to host_name
                    "host_phone": plan[4]        # Changed from phoneNumber to host_phone
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
                    vote_age = datetime.now(timezone.utc) - existing_vote[1].replace(tzinfo=None)
                    
                    # Update existing vote with audit trail
                    conn.execute(
                        text("""
                            UPDATE votes 
                            SET vote_type = :vote_type, updated_at = CURRENT_TIMESTAMP
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
                            VALUES (:id, :plan_id, :event_id, :voter_id, :vote_type, CURRENT_TIMESTAMP)
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
                
                # Register voter as active in Redis
                try:
                    redis_key = f"active_voters:{vote.plan_id}"
                    active_voters_data = cache_manager.get(redis_key) or {}
                    
                    # Add or update voter activity
                    active_voters_data[vote.voter_id] = {
                        'voter_id': vote.voter_id,
                        'last_activity': datetime.now(timezone.utc).isoformat(),
                        'current_session_votes': active_voters_data.get(vote.voter_id, {}).get('current_session_votes', 0) + 1
                    }
                    
                    # Save to Redis with TTL
                    cache_manager.set(redis_key, active_voters_data, ttl=600)  # 10 minute TTL
                    print(f"✅ Registered voter {vote.voter_id} as active in Redis")
                except Exception as redis_error:
                    print(f"⚠️ Redis error registering active voter: {redis_error}")
                    # Fallback to in-memory storage
                    if vote.plan_id not in active_voters:
                        active_voters[vote.plan_id] = {}
                    active_voters[vote.plan_id][vote.voter_id] = {
                        'voter_id': vote.voter_id,
                        'last_activity': datetime.now(timezone.utc).isoformat(),
                        'current_session_votes': 1
                    }
                
                # Update voter participation with audit timestamps
                conn.execute(
                    text("""
                        INSERT INTO voter_participation (id, plan_id, voter_id, events_voted_on, first_vote_at, last_vote_at)
                        VALUES (:id, :plan_id, :voter_id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        ON CONFLICT (plan_id, voter_id) 
                        DO UPDATE SET 
                            events_voted_on = voter_participation.events_voted_on + 1,
                            last_vote_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
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


@app.get("/api/plans/{plan_id}/votes/{voter_id}")
def get_voter_votes(plan_id: str, voter_id: str):
    """Get all votes for a specific voter in a plan"""
    try:
        with engine.connect() as conn:
            votes_result = conn.execute(
                text("""
                    SELECT event_id, vote_type, created_at, updated_at
                    FROM votes 
                    WHERE plan_id = :plan_id AND voter_id = :voter_id
                    ORDER BY created_at
                """),
                {
                    "plan_id": plan_id,
                    "voter_id": voter_id
                }
            )
            
            votes = []
            for row in votes_result:
                votes.append({
                    "event_id": row[0],
                    "vote_type": row[1],
                    "created_at": row[2].isoformat() if row[2] else None,
                    "updated_at": row[3].isoformat() if row[3] else None
                })
            
            return {
                "plan_id": plan_id,
                "voter_id": voter_id,
                "votes": votes,
                "total_votes": len(votes)
            }
            
    except Exception as e:
        print(f"❌ Error fetching votes: {str(e)}")
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
                    VALUES (:id, :name, :phone, CURRENT_TIMESTAMP)
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
                    WHERE v.created_at < datetime('now', '-30 days')
                """)
            ).rowcount
            
            # Delete old votes
            deleted_count = conn.execute(
                text("DELETE FROM votes WHERE created_at < datetime('now', '-30 days')")
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
                    WHERE created_at > datetime('now', '-7 days')
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
                    WHERE updated_at > datetime('now', '-7 days')
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

def optimize_events():
    """Optimize event storage (deduplicate, cache, archive)"""
    # Disabled: event_optimization module not found. Implement or restore if needed.
    return {"message": "Event optimization is not implemented in this deployment."}

def get_event_statistics():
    """Get event storage statistics"""
    # Disabled: event_optimization module not found. Implement or restore if needed.
    return {"message": "Event statistics not available in this deployment."}

@app.get("/admin/db/pool-status")
def get_db_pool_status():
    """Get database connection pool status"""
    # Check if we're in development mode
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise HTTPException(status_code=404, detail="Endpoint not found")
    try:
        pool = engine.pool
        pool_status = {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow()
        }
        return pool_status
    except Exception as e:
        logger.error(f"Error getting pool status: {str(e)}")
        return {"error": str(e)}

@app.get("/api/events/trending")
@cached(ttl=300, key_prefix="trending")  # Cache for 5 minutes
async def get_trending_events(zip: str = Query(..., description="ZIP code to get trending events for")):
    """Get trending events for a specific ZIP code area with caching"""
    # Not implemented: return empty or placeholder response
    return {"events": [], "message": "Trending events not implemented yet."}

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

# Redis-based session management for active voters
from core.session_manager import active_voter_manager

@app.post("/api/plans/{plan_id}/active-voters")
def update_active_voter(plan_id: str, data: dict):
    """Update active voter status (join/leave) for a plan"""
    voter_id = data.get("voter_id")
    action   = data.get("action")
    name     = data.get("name", "Unknown")
    
    if not voter_id or action not in ("join", "leave"):
        raise HTTPException(400, "Must provide voter_id and action='join' or 'leave'")
    
    if action == "join":
        return active_voter_manager.join_plan(plan_id, voter_id, name)
    else:  # action == "leave"
        return active_voter_manager.leave_plan(plan_id, voter_id)

@app.get("/api/plans/{plan_id}/active-voters")
def get_active_voters(plan_id: str):
    """Get active voters for a plan"""
    try:
        active_voters_data = active_voter_manager.get_active_voters(plan_id)
        
        # Convert to frontend-expected format
        current_time = datetime.now(timezone.utc)
        voters_list = []
        
        for voter in active_voters_data:
            try:
                joined_time = datetime.fromisoformat(voter['joined_at'])
                time_elapsed = (current_time - joined_time).total_seconds()
                time_remaining = max(0, 300 - time_elapsed)  # 5 minutes total
                
                voters_list.append({
                    'voter_id': voter['id'],
                    'name': voter['name'],
                    'time_remaining': int(time_remaining),
                    'joined_at': voter['joined_at']
                })
            except Exception as e:
                logger.warning(f"Error processing voter data: {e}")
                continue
        
        return {"active_voters": voters_list}
    except Exception as e:
        logger.error(f"Error getting active voters: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/plans/{plan_id}/validate-creator")
def validate_creator(plan_id: str, data: dict):
    """Validate if the claimed creator ID is actually the creator of the plan"""
    try:
        claimed_creator_id = data.get("claimed_creator_id")
        
        if not claimed_creator_id:
            return {"is_valid_creator": False, "message": "No creator ID provided"}
        
        # Check if the claimed creator ID matches the expected format for this plan
        expected_creator_id = f"host_{plan_id}"
        
        # Validate that the claimed creator ID matches the expected format
        is_valid = claimed_creator_id == expected_creator_id
        
        # Additionally, check if the plan exists
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id FROM plans WHERE id = :plan_id LIMIT 1"),
                {"plan_id": plan_id}
            )
            plan_exists = result.fetchone() is not None
        
        return {
            "is_valid_creator": is_valid and plan_exists,
            "message": "Creator validation completed",
            "plan_exists": plan_exists
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/plans/{plan_id}/add-voter")
def add_voter_to_plan(plan_id: str, data: dict):
    """Add a voter to a plan and increment max_voters"""
    try:
        voter_id = data.get("voter_id")
        voter_name = data.get("voter_name")
        voter_phone = data.get("voter_phone")
        
        if not voter_id:
            return {"success": False, "message": "Voter ID required"}
        
        with engine.connect() as conn:
            # Check if plan exists
            plan_result = conn.execute(
                text("SELECT id FROM plans WHERE id = :plan_id"),
                {"plan_id": plan_id}
            )
            plan_data = plan_result.fetchone()
            
            if not plan_data:
                return {"success": False, "message": "Plan not found"}
            
            # Get current max_voters (computed dynamically like in get_voting_status)
            unique_voters_result = conn.execute(
                text("SELECT DISTINCT voter_id FROM votes WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchall()
            
            # Also include registered participants who haven't voted yet
            participants_result = conn.execute(
                text("SELECT DISTINCT voter_id FROM voter_participation WHERE plan_id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchall()
            
            # Combine voter IDs from both sources
            all_voter_ids = set()
            for row in unique_voters_result:
                all_voter_ids.add(row[0])
            for row in participants_result:
                all_voter_ids.add(row[0])
            
            current_max_voters = len(all_voter_ids) if all_voter_ids else 1
            
            # Check if voter is already registered with this plan
            voter_check = conn.execute(
                text("""
                    SELECT 1 FROM voter_participation 
                    WHERE plan_id = :plan_id AND voter_id = :voter_id
                """),
                {"plan_id": plan_id, "voter_id": voter_id}
            )
            
            if voter_check.fetchone():
                return {"success": True, "message": "Voter already registered", "already_registered": True}
            
            # Add voter to voter_participation table
            participation_id = str(uuid.uuid4())
            conn.execute(
                text("""
                    INSERT INTO voter_participation (id, plan_id, voter_id, created_at)
                    VALUES (:id, :plan_id, :voter_id, :created_at)
                """),
                {
                    "id": participation_id,
                    "plan_id": plan_id,
                    "voter_id": voter_id,
                    "created_at": datetime.utcnow()
                }
            )
            
            conn.commit()
            
            # Calculate new max_voters after adding this voter
            new_max_voters = current_max_voters + 1 if voter_id not in all_voter_ids else current_max_voters
            
            return {
                "success": True, 
                "message": "Voter added to plan successfully",
                "max_voters": new_max_voters,
                "voter_id": voter_id
            }
            
    except Exception as e:
        logger.error(f"Error adding voter to plan: {e}")
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
    """Send verification code to phone number - COMMENTED OUT FOR DEVELOPMENT"""
    # SMS functionality disabled for development
    logger.info(f"🚧 SMS endpoint called but disabled for development: {phone}")
    return {
        "success": True,
        "session_id": "dev_session_123",
        "message": "Development mode - SMS verification disabled"
    }
    
    
    # SMS CODE COMMENTED OUT FOR DEVELOPMENT
    # Uncomment the code below for production SMS verification
    pass

@app.post("/api/auth/verify-code")
@monitor_performance
async def verify_code(session_data: dict):
    """Verify SMS code and return access token - COMMENTED OUT FOR DEVELOPMENT"""
    # SMS verification disabled for development
    logger.info(f"🚧 SMS verification endpoint called but disabled for development")
    return {
        "success": True,
        "access_token": "dev_token_123",
        "refresh_token": "dev_refresh_123",
        "user_id": "dev_user_123",
        "user_name": "Development User",
        "phone": "+1234567890"
    }
    
    
    # SMS VERIFICATION CODE COMMENTED OUT FOR DEVELOPMENT
    # Uncomment the code below for production SMS verification
    pass

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
