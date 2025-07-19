#!/usr/bin/env python3
"""
Check database constraints
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv('../.env')

def check_constraints():
    """Check database constraints"""
    
    engine = create_engine(os.getenv('DATABASE_URL'))
    conn = engine.connect()
    
    # Check source_type constraint
    result = conn.execute(text("""
        SELECT pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conname = 'events_source_type_check'
    """))
    
    constraint = result.fetchone()
    print(f"🔒 Source type constraint: {constraint[0] if constraint else 'Not found'}")
    
    # Check other constraints
    result = conn.execute(text("""
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'events'::regclass
    """))
    
    print("\n🔒 All events table constraints:")
    for row in result:
        print(f"   {row[0]}: {row[1]}")
    
    conn.close()

if __name__ == "__main__":
    check_constraints() 