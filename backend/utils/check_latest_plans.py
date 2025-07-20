#!/usr/bin/env python3
"""
Check latest plans and their events
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv('../.env')

def check_latest_plans():
    """Check latest plans and their events"""
    
    engine = create_engine(os.getenv('DATABASE_URL'))
    conn = engine.connect()
    
    # Get latest 3 plans
    result = conn.execute(text("""
        SELECT id, topic, zip_code, created_at 
        FROM plans 
        ORDER BY created_at DESC 
        LIMIT 3
    """))
    
    plans = result.fetchall()
    
    print("📋 Latest plans:")
    for plan in plans:
        plan_id, topic, zip_code, created_at = plan
        print(f"   Plan: {plan_id}")
        print(f"   Topic: {topic}, Zip: {zip_code}, Created: {created_at}")
        
        # Get events for this plan
        result = conn.execute(text("SELECT COUNT(*) FROM events WHERE plan_id = :plan_id"), {"plan_id": plan_id})
        event_count = result.scalar()
        print(f"   Events: {event_count}")
        
        if event_count > 0:
            # Get sample events
            result = conn.execute(text("""
                SELECT name, source_type 
                FROM events 
                WHERE plan_id = :plan_id 
                LIMIT 3
            """), {"plan_id": plan_id})
            
            events = result.fetchall()
            for event in events:
                print(f"     - {event[0]} ({event[1]})")
        
        print()
    
    conn.close()

if __name__ == "__main__":
    check_latest_plans() 