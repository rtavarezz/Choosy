import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# FORCE SQLite for development - bypass any existing DATABASE_URL
print("🚧 Forcing SQLite for development (bypassing DATABASE_URL)")
DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=os.getenv("DEBUG", "false").lower() == "true"
)

# Comment out the original code temporarily
"""
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Use SQLite for development when DATABASE_URL is not set
    print("🚧 DATABASE_URL not set, using SQLite for development")
    DATABASE_URL = "sqlite:///./test.db"
    
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite specific
        echo=os.getenv("DEBUG", "false").lower() == "true"
    )
else:
    # Use PostgreSQL/Supabase for production
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=30,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_timeout=30,
        echo=os.getenv("DEBUG", "false").lower() == "true"  # Log SQL queries in debug mode
    )
"""

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 