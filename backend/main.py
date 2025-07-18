from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
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
import json

# Import our location service
from location_services import location_service

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Choosy API", description="Secure API for Choosy app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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

class UserCreate(BaseModel):
    name: str
    phone: str

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
    return test_db()

def generate_mock_events(topic: str, group_size: str) -> List[dict]:
    topic_events = {
        "concerts": [
            {"name": "Taylor Swift Concert", "image": None, "hours": "3 hours", "source_type": "mock", "metadata": {"venue": "Stadium", "price": "$150"}},
            {"name": "Rock Band Live", "image": None, "hours": "2.5 hours", "source_type": "mock", "metadata": {"venue": "Arena", "price": "$80"}},
            {"name": "Jazz Night", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Club", "price": "$45"}},
            {"name": "Classical Symphony", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Concert Hall", "price": "$75"}},
            {"name": "Indie Music Festival", "image": None, "hours": "4 hours", "source_type": "mock", "metadata": {"venue": "Outdoor", "price": "$60"}}
        ],
        "nightlife": [
            {"name": "Cocktail Bar", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Downtown", "price": "$30"}},
            {"name": "Dance Club", "image": None, "hours": "3 hours", "source_type": "mock", "metadata": {"venue": "Nightclub", "price": "$25"}},
            {"name": "Karaoke Night", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Bar", "price": "$20"}},
            {"name": "Wine Tasting", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Winery", "price": "$40"}},
            {"name": "Comedy Club", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Comedy Club", "price": "$35"}}
        ],
        "foodie": [
            {"name": "Sushi Restaurant", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Restaurant", "price": "$50"}},
            {"name": "Italian Bistro", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Bistro", "price": "$45"}},
            {"name": "Food Truck Festival", "image": None, "hours": "2.5 hours", "source_type": "mock", "metadata": {"venue": "Outdoor", "price": "$25"}},
            {"name": "Cooking Class", "image": None, "hours": "3 hours", "source_type": "mock", "metadata": {"venue": "Kitchen", "price": "$75"}},
            {"name": "Farm-to-Table Dinner", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Restaurant", "price": "$65"}}
        ],
        "datenight": [
            {"name": "Romantic Dinner", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Restaurant", "price": "$80"}},
            {"name": "Movie Night", "image": None, "hours": "2.5 hours", "source_type": "mock", "metadata": {"venue": "Cinema", "price": "$30"}},
            {"name": "Couples Massage", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Spa", "price": "$120"}},
            {"name": "Sunset Walk", "image": None, "hours": "1 hour", "source_type": "mock", "metadata": {"venue": "Park", "price": "Free"}},
            {"name": "Dance Lessons", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Studio", "price": "$60"}}
        ],
        "sports": [
            {"name": "Basketball Game", "image": None, "hours": "2.5 hours", "source_type": "mock", "metadata": {"venue": "Arena", "price": "$75"}},
            {"name": "Baseball Game", "image": None, "hours": "3 hours", "source_type": "mock", "metadata": {"venue": "Stadium", "price": "$45"}},
            {"name": "Soccer Match", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Field", "price": "$35"}},
            {"name": "Tennis Match", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Court", "price": "$25"}},
            {"name": "Golf Tournament", "image": None, "hours": "4 hours", "source_type": "mock", "metadata": {"venue": "Course", "price": "$90"}}
        ],
        "parks": [
            {"name": "Hiking Trail", "image": None, "hours": "3 hours", "source_type": "mock", "metadata": {"venue": "Trail", "price": "Free"}},
            {"name": "Picnic in Park", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Park", "price": "Free"}},
            {"name": "Bike Ride", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Trail", "price": "$15"}},
            {"name": "Bird Watching", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Park", "price": "Free"}},
            {"name": "Frisbee Golf", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Course", "price": "$10"}}
        ],
        "gokart": [
            {"name": "Indoor Go-Kart Racing", "image": None, "hours": "1 hour", "source_type": "mock", "metadata": {"venue": "Track", "price": "$35"}},
            {"name": "Outdoor Go-Kart Track", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Track", "price": "$40"}},
            {"name": "Electric Go-Karts", "image": None, "hours": "1 hour", "source_type": "mock", "metadata": {"venue": "Track", "price": "$30"}},
            {"name": "Go-Kart Tournament", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Track", "price": "$50"}},
            {"name": "Family Go-Kart Day", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Track", "price": "$25"}}
        ],
        "swimming": [
            {"name": "Public Pool", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Pool", "price": "$8"}},
            {"name": "Water Park", "image": None, "hours": "4 hours", "source_type": "mock", "metadata": {"venue": "Water Park", "price": "$25"}},
            {"name": "Swimming Lessons", "image": None, "hours": "1 hour", "source_type": "mock", "metadata": {"venue": "Pool", "price": "$20"}},
            {"name": "Beach Day", "image": None, "hours": "3 hours", "source_type": "mock", "metadata": {"venue": "Beach", "price": "Free"}},
            {"name": "Hot Springs", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Springs", "price": "$30"}}
        ],
        "drinks": [
            {"name": "Craft Beer Tasting", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Brewery", "price": "$35"}},
            {"name": "Wine Bar", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Bar", "price": "$40"}},
            {"name": "Cocktail Lounge", "image": None, "hours": "2 hours", "source_type": "mock", "metadata": {"venue": "Lounge", "price": "$45"}},
            {"name": "Coffee Shop", "image": None, "hours": "1 hour", "source_type": "mock", "metadata": {"venue": "Cafe", "price": "$15"}},
            {"name": "Tea House", "image": None, "hours": "1.5 hours", "source_type": "mock", "metadata": {"venue": "Tea House", "price": "$25"}}
        ]
    }
    
    events = topic_events.get(topic, topic_events["drinks"])
    
    if group_size == "solo":
        solo_events = [e for e in events if "Tournament" not in e["name"] and "Family" not in e["name"]]
        return solo_events[:2]  # Only 2 events for solo
    elif group_size in ["friend", "date", "2"]:
        couple_events = [e for e in events if "Tournament" not in e["name"] and "Family" not in e["name"]]
        return couple_events[:3]  # Only 3 events for couples
    else:
        return events[:4]  # Only 4 events for groups

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
            
            mock_events = generate_mock_events(plan.topic, plan.group_size)
            for event in mock_events:
                event_id = str(uuid.uuid4())
                conn.execute(
                    text("""
                        INSERT INTO events (id, plan_id, name, image, hours, source_type, votes_count, metadata)
                        VALUES (:id, :plan_id, :name, :image, :hours, :source_type, 0, :metadata)
                    """),
                    {
                        "id": event_id,
                        "plan_id": plan_id,
                        "name": event["name"],
                        "image": event.get("image"),
                        "hours": event.get("hours"),
                        "source_type": "custom",
                        "metadata": json.dumps(event.get("metadata", {}))
                    }
                )
            
            for event in plan.custom_events[:2]:  # Limit to 2 custom events max
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
                if row[6] and row[6] != 'null' and row[6] != 'None':
                    try:
                        metadata = json.loads(row[6])
                    except (json.JSONDecodeError, TypeError):
                        metadata = {}
                
                events.append({
                    "id": row[0],
                    "name": row[1],
                    "image": row[2],
                    "hours": row[3],
                    "source_type": row[4],
                    "votes_count": row[5] or 0,
                    "metadata": metadata
                })
            
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
                text("SELECT topic, group_size, host_name FROM plans WHERE id = :plan_id"),
                {"plan_id": plan_id}
            ).fetchone()
            
            if not plan_result:
                raise HTTPException(status_code=404, detail="Plan not found")
            
            plan = {
                "topic": plan_result[0],
                "group_size": plan_result[1],
                "host_name": plan_result[2]
            }
            
            # Calculate max voters based on group size
            max_voters = 1 if plan["group_size"] == "solo" else (2 if plan["group_size"] in ["date", "friend"] else 5)
            
            # Count unique voters who have completed voting
            completed_voters_result = conn.execute(
                text("""
                    SELECT COUNT(DISTINCT voter_id) 
                    FROM votes 
                    WHERE plan_id = :plan_id
                """),
                {"plan_id": plan_id}
            ).scalar()
            
            completed_voters = completed_voters_result or 0
            
            # Check if voting limit reached
            voting_limit_reached = completed_voters >= max_voters
            
            return {
                "plan_id": plan_id,
                "topic": plan["topic"],
                "group_size": plan["group_size"],
                "host_name": plan["host_name"],
                "max_voters": max_voters,
                "completed_voters": completed_voters,
                "voting_limit_reached": voting_limit_reached,
                "can_vote": not voting_limit_reached
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
                    
                    # Note: We no longer update votes_count field since we calculate from votes table
                    # The votes_count field is kept for backward compatibility but not used in results
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
                    
                    # Note: We no longer update votes_count field since we calculate from votes table
                    # The votes_count field is kept for backward compatibility but not used in results
                
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
    try:
        with engine.connect() as conn:
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
        print(f"Error in get_event_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 