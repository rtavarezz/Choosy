#!/usr/bin/env python3
"""
Script to insert test data into Supabase database
This will create sample users, plans, events, and votes for testing
"""

import os
import uuid
import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

engine = create_engine(DATABASE_URL)

def insert_test_data():
    """Insert test data into the database"""
    try:
        with engine.connect() as conn:
            print("🔄 Inserting test data into Supabase...")
            
            # 1. Insert test users
            test_users = [
                {
                    "id": str(uuid.uuid4()),
                    "phone": "+15551234567",
                    "name": "John Smith"
                },
                {
                    "id": str(uuid.uuid4()),
                    "phone": "+15559876543", 
                    "name": "Jane Doe"
                },
                {
                    "id": str(uuid.uuid4()),
                    "phone": "+15551112233",
                    "name": "Bob Wilson"
                }
            ]
            
            for user in test_users:
                conn.execute(
                    text("""
                        INSERT INTO users (id, phone, name, created_at, updated_at)
                        VALUES (:id, :phone, :name, NOW(), NOW())
                        ON CONFLICT (phone) DO NOTHING
                    """),
                    user
                )
                print(f"✅ Inserted user: {user['name']} ({user['phone']})")
            
            # 2. Insert test plans
            test_plans = [
                {
                    "id": str(uuid.uuid4()),
                    "topic": "concerts",
                    "group_size": "solo",
                    "zip_code": "10001",
                    "host_name": "John Smith",
                    "host_phone": "+15551234567"
                },
                {
                    "id": str(uuid.uuid4()),
                    "topic": "nightlife",
                    "group_size": "date",
                    "zip_code": "10002",
                    "host_name": "Jane Doe",
                    "host_phone": "+15559876543"
                },
                {
                    "id": str(uuid.uuid4()),
                    "topic": "foodie",
                    "group_size": "group",
                    "zip_code": "10003",
                    "host_name": "Bob Wilson",
                    "host_phone": "+15551112233"
                }
            ]
            
            for plan in test_plans:
                conn.execute(
                    text("""
                        INSERT INTO plans (id, topic, group_size, zip_code, host_name, host_phone, created_at, expires_at, is_active)
                        VALUES (:id, :topic, :group_size, :zip_code, :host_name, :host_phone, NOW(), NOW() + INTERVAL '15 minutes', TRUE)
                    """),
                    plan
                )
                print(f"✅ Inserted plan: {plan['topic']} for {plan['group_size']} group")
                
                # 3. Insert events for each plan
                events_data = {
                    "concerts": [
                        {"name": "Taylor Swift Concert", "hours": "3 hours", "metadata": {"venue": "Stadium", "price": "$150"}},
                        {"name": "Jazz Night", "hours": "2 hours", "metadata": {"venue": "Club", "price": "$45"}},
                        {"name": "Rock Band Live", "hours": "2.5 hours", "metadata": {"venue": "Arena", "price": "$80"}}
                    ],
                    "nightlife": [
                        {"name": "Cocktail Bar", "hours": "2 hours", "metadata": {"venue": "Downtown", "price": "$30"}},
                        {"name": "Dance Club", "hours": "3 hours", "metadata": {"venue": "Nightclub", "price": "$25"}},
                        {"name": "Karaoke Night", "hours": "2 hours", "metadata": {"venue": "Bar", "price": "$20"}}
                    ],
                    "foodie": [
                        {"name": "Sushi Restaurant", "hours": "1.5 hours", "metadata": {"venue": "Restaurant", "price": "$50"}},
                        {"name": "Italian Bistro", "hours": "2 hours", "metadata": {"venue": "Bistro", "price": "$45"}},
                        {"name": "Food Truck Festival", "hours": "2.5 hours", "metadata": {"venue": "Outdoor", "price": "$25"}}
                    ]
                }
                
                events = events_data.get(plan["topic"], [])
                for event in events:
                    event_id = str(uuid.uuid4())
                    conn.execute(
                        text("""
                            INSERT INTO events (id, plan_id, name, image, hours, source_type, votes_count, metadata, created_at)
                            VALUES (:id, :plan_id, :name, :image, :hours, :source_type, 0, :metadata, NOW())
                        """),
                        {
                            "id": event_id,
                            "plan_id": plan["id"],
                            "name": event["name"],
                            "image": None,
                            "hours": event["hours"],
                            "source_type": "custom",
                            "metadata": json.dumps(event["metadata"])
                        }
                    )
                    print(f"  📍 Inserted event: {event['name']}")
                    
                    # 4. Insert some votes for each event
                    voter_ids = ["voter_1234567890", "voter_0987654321", "voter_5556667778"]
                    for i, voter_id in enumerate(voter_ids):
                        vote_type = "like" if i % 2 == 0 else "dislike"
                        conn.execute(
                            text("""
                                INSERT INTO votes (id, plan_id, event_id, voter_id, vote_type, created_at)
                                VALUES (:id, :plan_id, :event_id, :voter_id, :vote_type, NOW())
                                ON CONFLICT (plan_id, event_id, voter_id) DO NOTHING
                            """),
                            {
                                "id": str(uuid.uuid4()),
                                "plan_id": plan["id"],
                                "event_id": event_id,
                                "voter_id": voter_id,
                                "vote_type": vote_type
                            }
                        )
                    
                    # Update vote count
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
                        {"event_id": event_id}
                    )
            
            # 5. Insert user_plans relationships (skipping for now - table doesn't exist)
            print("  ⚠️  Skipping user_plans relationships (table not created yet)")
            
            # 6. Insert some custom events
            custom_events = [
                {
                    "plan_id": test_plans[0]["id"],
                    "name": "Custom Rock Concert",
                    "description": "A special rock concert organized by the group",
                    "created_by": "+15551234567"
                },
                {
                    "plan_id": test_plans[1]["id"], 
                    "name": "Custom Wine Tasting",
                    "description": "Private wine tasting event",
                    "created_by": "+15559876543"
                }
            ]
            
            for custom_event in custom_events:
                conn.execute(
                    text("""
                        INSERT INTO custom_events (id, plan_id, name, description, contact, created_by, created_at)
                        VALUES (:id, :plan_id, :name, :description, :contact, :created_by, NOW())
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "plan_id": custom_event["plan_id"],
                        "name": custom_event["name"],
                        "description": custom_event["description"],
                        "contact": json.dumps({"phone": custom_event["created_by"]}),
                        "created_by": custom_event["created_by"]
                    }
                )
                print(f"  🎯 Inserted custom event: {custom_event['name']}")
            
            conn.commit()
            print("\n🎉 Test data inserted successfully!")
            print(f"📊 Created {len(test_users)} users, {len(test_plans)} plans, and multiple events with votes")
            print("🔍 Check your Supabase dashboard to see the data!")
            
    except Exception as e:
        print(f"❌ Error inserting test data: {e}")
        raise

if __name__ == "__main__":
    insert_test_data() 