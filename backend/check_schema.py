#!/usr/bin/env python3
"""
Check database schema
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv('../.env')

def check_schema():
    """Check database schema"""
    
    engine = create_engine(os.getenv('DATABASE_URL'))
    conn = engine.connect()
    
    # Check events table schema
    result = conn.execute(text("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        ORDER BY ordinal_position
    """))
    
    print("📋 Events table schema:")
    for row in result:
        print(f"   {row[0]}: {row[1]} ({row[2]})")
    
    # Check constraints
    result = conn.execute(text("""
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'events'
    """))
    
    print("\n🔒 Events table constraints:")
    for row in result:
        print(f"   {row[0]}: {row[1]}")
    
    conn.close()

if __name__ == "__main__":
    check_schema() 