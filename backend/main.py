from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional
import os
import secrets
import uuid

# Always load .env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Choosy API", description="Secure API for Choosy app")

# Pydantic models for request/response
class PlanCreate(BaseModel):
    topic: str
    group_size: str
    zip_code: str
    host_name: str
    host_phone: str
    custom_events: Optional[List[dict]] = []

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
    group_size: Optional[str] = "solo"
    event_time: Optional[str] = "7:00 PM"
    event_date: Optional[str] = None

# Security utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception

# Public endpoints (no authentication required)
@app.get("/")
def health():
    return {"status": "ok", "message": "Choosy API is running"}

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
    """Alias for test-db endpoint"""
    return test_db()

# Plans endpoints
@app.post("/api/plans")
def create_plan(plan: PlanCreate):
    """Create a new plan"""
    try:
        plan_id = str(uuid.uuid4())
        with engine.connect() as conn:
            # Insert plan
            conn.execute(
                text("""
                    INSERT INTO plans (id, topic, group_size, zip_code, host_name, host_phone, created_at, expires_at)
                    VALUES (:id, :topic, :group_size, :zip_code, :host_name, :host_phone, NOW(), NOW() + INTERVAL '15 minutes')
                """),
                {
                    "id": plan_id,
                    "topic": plan.topic,
                    "group_size": plan.group_size,
                    "zip_code": plan.zip_code,
                    "host_name": plan.host_name,
                    "host_phone": plan.host_phone
                }
            )
            
            # Insert custom events if any
            for event in plan.custom_events:
                event_id = str(uuid.uuid4())
                conn.execute(
                    text("""
                        INSERT INTO events (id, plan_id, name, source_type, votes_count)
                        VALUES (:id, :plan_id, :name, 'custom', 0)
                    """),
                    {
                        "id": event_id,
                        "plan_id": plan_id,
                        "name": event.get("name", "Custom Event")
                    }
                )
            
            conn.commit()
            return {"id": plan_id, "message": "Plan created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans/{plan_id}/results")
def get_plan_results(plan_id: str):
    """Get voting results for a plan"""
    try:
        with engine.connect() as conn:
            # Get plan details
            plan_result = conn.execute(
                text("SELECT topic, group_size, zip_code, host_name, host_phone FROM plans WHERE id = :id"),
                {"id": plan_id}
            )
            plan = plan_result.fetchone()
            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")
            
            # Get events and their vote counts
            events_result = conn.execute(
                text("""
                    SELECT e.id, e.name, e.votes_count,
                           COUNT(v.id) as total_votes,
                           COUNT(CASE WHEN v.vote_type = 'like' THEN 1 END) as likes,
                           COUNT(CASE WHEN v.vote_type = 'dislike' THEN 1 END) as dislikes
                    FROM events e
                    LEFT JOIN votes v ON e.id = v.event_id
                    WHERE e.plan_id = :plan_id
                    GROUP BY e.id, e.name, e.votes_count
                    ORDER BY likes DESC, e.votes_count DESC
                """),
                {"plan_id": plan_id}
            )
            events = []
            for row in events_result:
                total_votes = row[3] or 0
                likes = row[4] or 0
                dislikes = row[5] or 0
                percentage = (likes / total_votes * 100) if total_votes > 0 else 0
                events.append({
                    "id": row[0],
                    "name": row[1],
                    "votes": likes,
                    "total_votes": total_votes,
                    "percentage": round(percentage, 1)
                })
            
            # Get unique voters
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

# Votes endpoints
@app.post("/api/votes")
def create_vote(vote: VoteCreate):
    """Create a new vote"""
    try:
        vote_id = str(uuid.uuid4())
        with engine.connect() as conn:
            # Check if vote already exists
            existing_vote = conn.execute(
                text("SELECT id FROM votes WHERE plan_id = :plan_id AND event_id = :event_id AND voter_id = :voter_id"),
                {
                    "plan_id": vote.plan_id,
                    "event_id": vote.event_id,
                    "voter_id": vote.voter_id
                }
            ).fetchone()
            
            if existing_vote:
                # Update existing vote
                conn.execute(
                    text("UPDATE votes SET vote_type = :vote_type WHERE id = :id"),
                    {
                        "vote_type": vote.vote_type,
                        "id": existing_vote[0]
                    }
                )
                vote_id = existing_vote[0]
            else:
                # Create new vote
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
            
            # Update event vote count
            conn.execute(
                text("""
                    UPDATE events 
                    SET votes_count = (
                        SELECT COUNT(*) 
                        FROM votes 
                        WHERE event_id = :event_id AND vote_type = 'like'
                    )
                    WHERE id = :event_id
                """),
                {"event_id": vote.event_id}
            )
            
            conn.commit()
            return {"id": vote_id, "message": "Vote recorded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reservations endpoints
@app.post("/api/reservations")
def create_reservation(reservation: ReservationCreate):
    """Create a new reservation"""
    try:
        reservation_id = f"RES-{int(datetime.now().timestamp())}-{secrets.token_hex(4)}"
        confirmation_number = f"CNF-{secrets.token_hex(3).upper()}"
        
        # Mock reservation providers
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
        
        # Simulate processing delay
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

# Authentication endpoint
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        with engine.connect() as conn:
            # Check if user exists by phone number
            result = conn.execute(
                text("SELECT id, phone, name FROM users WHERE phone = :phone"),
                {"phone": form_data.username}
            )
            user = result.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect phone number",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # For now, we'll use a simple password check
            # In production, you'd want to store hashed passwords
            if form_data.password != "demo123":  # Replace with proper password verification
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user[0]}, expires_delta=access_token_expires
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user[0],
                "user_name": user[2]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Protected endpoints (require authentication)
@app.get("/users/me")
def get_my_user(current_user_id: str = Depends(get_current_user)):
    """Get current user's information (authenticated only)"""
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
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, name FROM users LIMIT 10"))
            users = [{"id": row[0], "name": row[1]} for row in result]
            return {"users": users, "warning": "This endpoint should be removed in production"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 