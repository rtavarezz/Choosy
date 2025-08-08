#!/usr/bin/env python3
"""
Initialize SQLite database for development
"""

import os
import sqlite3
from pathlib import Path

def init_sqlite_db():
    """Initialize SQLite database with required tables"""
    
    # Create database file in backend directory
    db_path = Path(__file__).parent / "test.db"
    print(f"Creating SQLite database at: {db_path}")
    
    # Connect to SQLite database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Create tables (SQLite compatible versions)
    print("Creating tables...")
    
    # Plans table (simplified for SQLite)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            topic TEXT NOT NULL CHECK (topic IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'racing', 'swimming', 'drinks', 'movies', 'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family', 'bored')),
            group_size TEXT NOT NULL CHECK (group_size IN ('myself', '2', '3+')),
            zip_code TEXT NOT NULL,
            host_name TEXT NOT NULL,
            host_phone TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP DEFAULT (datetime('now', '+15 minutes')),
            is_active BOOLEAN DEFAULT TRUE
        )
    """)
    
    # Events table (SQLite compatible). Use image column to match backend queries
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            image TEXT,
            hours TEXT,
            source_type TEXT NOT NULL CHECK (source_type IN ('yelp', 'ticketmaster', 'custom', 'google', 'eventbrite', 'mock', 'local')),
            votes_count INTEGER DEFAULT 0,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Votes table (SQLite compatible) + updated_at for audit
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS votes (
            id TEXT PRIMARY KEY,
            plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
            event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
            voter_id TEXT NOT NULL,
            vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(plan_id, event_id, voter_id)
        )
    """)
    
    # Users table (basic version for development)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            phone TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Voter participation table for optimized voting
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS voter_participation (
            id TEXT PRIMARY KEY,
            plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
            voter_id TEXT NOT NULL,
            events_voted_on INTEGER DEFAULT 0,
            completed_voting BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            first_vote_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_vote_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(plan_id, voter_id)
        )
    """)
    
    conn.commit()
    conn.close()
    
    print("SQLite database initialized successfully!")
    print(f"Database location: {db_path}")

if __name__ == "__main__":
    init_sqlite_db() 