#!/usr/bin/env python3
"""
Simple Backend Test for Choosy
Tests FastAPI endpoints and database connectivity
"""

import asyncio
import httpx
import json
from typing import Dict, Any
import uuid
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_DATA = {
    "plan": {
        "topic": "foodie",
        "group_size": "solo",
        "zip_code": "10001",
        "host_name": "Test Host",
        "host_phone": "+15551234567"
    },
    "vote": {
        "plan_id": None,  # Will be set after plan creation
        "event_id": None,  # Will be set after event creation
        "voter_id": "test-voter-123",
        "vote_type": "like"
    }
}

# Use the same DATABASE_URL as your main.py
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def insert_test_event(plan_id):
    event_id = str(uuid.uuid4())
    with engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO events (id, plan_id, name, source_type, votes_count)
                VALUES (:id, :plan_id, :name, 'custom', 0)
            """),
            {
                "id": event_id,
                "plan_id": plan_id,
                "name": "Test Event"
            }
        )
        conn.commit()
    return event_id

async def test_server_health() -> bool:
    """Test if the FastAPI server is running"""
    print("🔌 Testing server health...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs")
            
        if response.status_code == 200:
            print("✅ Server is running and accessible")
            return True
        else:
            print(f"❌ Server responded with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Server health check failed: {e}")
        return False

async def test_create_plan() -> bool:
    """Test plan creation endpoint"""
    print("\n📋 Testing plan creation...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/plans",
                json=TEST_DATA["plan"]
            )
            
        if response.status_code == 200:
            data = response.json()
            plan_id = data.get('id', 'unknown')
            print(f"✅ Plan created successfully: {plan_id}")
            # Store plan_id for vote test
            TEST_DATA["vote"]["plan_id"] = plan_id
            return plan_id
        else:
            print(f"❌ Plan creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Plan creation error: {e}")
        return False

async def test_get_plans() -> bool:
    """Test getting plans endpoint"""
    print("\n📋 Testing get plans...")
    
    try:
        # First create a plan to test with
        async with httpx.AsyncClient() as client:
            create_response = await client.post(
                f"{BASE_URL}/api/plans",
                json=TEST_DATA["plan"]
            )
            
        if create_response.status_code == 200:
            plan_data = create_response.json()
            plan_id = plan_data.get("id")
            
            # Now test getting results for that plan
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/api/plans/{plan_id}/results")
                
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Retrieved plan results successfully")
                return True
            else:
                print(f"❌ Get plan results failed: {response.status_code}")
                return False
        else:
            print(f"❌ Could not create test plan: {create_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Get plans error: {e}")
        return False

async def test_vote_creation() -> bool:
    """Test vote creation endpoint"""
    print("\n🗳️ Testing vote creation...")
    
    # Skip if no plan_id or event_id available
    if not TEST_DATA["vote"]["plan_id"] or not TEST_DATA["vote"]["event_id"]:
        print("⚠️ Skipping vote test - no plan_id or event_id available")
        return True
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/votes",
                json=TEST_DATA["vote"]
            )
            
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Vote created successfully: {data.get('id', 'unknown')}")
            return True
        else:
            print(f"❌ Vote creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Vote creation error: {e}")
        return False

async def test_get_results() -> bool:
    """Test getting results endpoint"""
    print("\n📊 Testing get results...")
    
    # Use the plan_id from the created plan
    plan_id = TEST_DATA["vote"]["plan_id"]
    if not plan_id:
        print("⚠️ Skipping results test - no plan_id available")
        return True
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/plans/{plan_id}/results")
            
        if response.status_code == 200:
            data = response.json()
            print("✅ Results retrieved successfully")
            return True
        else:
            print(f"❌ Get results failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Get results error: {e}")
        return False

async def test_database_connection() -> bool:
    """Test database connectivity through API"""
    print("\n🗄️ Testing database connection...")
    
    try:
        async with httpx.AsyncClient() as client:
            # Try to create a plan to test database connection
            response = await client.post(
                f"{BASE_URL}/api/plans",
                json=TEST_DATA["plan"]
            )
            
        if response.status_code == 200:
            print("✅ Database connection working")
            return True
        else:
            print(f"❌ Database connection failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

async def run_backend_tests() -> bool:
    """Run all backend tests"""
    print("🚀 Starting Choosy Backend Tests...\n")
    
    results = {}
    
    # Run tests in order, some depend on previous results
    try:
        results["Server Health"] = await test_server_health()
    except Exception as e:
        print(f"❌ Server Health failed with exception: {e}")
        results["Server Health"] = False
    
    try:
        results["Database Connection"] = await test_database_connection()
    except Exception as e:
        print(f"❌ Database Connection failed with exception: {e}")
        results["Database Connection"] = False
    
    try:
        plan_id = await test_create_plan()
        results["Create Plan"] = bool(plan_id)
        if plan_id:
            event_id = insert_test_event(plan_id)
            TEST_DATA["vote"]["event_id"] = event_id
    except Exception as e:
        print(f"❌ Create Plan failed with exception: {e}")
        results["Create Plan"] = False
    
    try:
        results["Get Plans"] = await test_get_plans()
    except Exception as e:
        print(f"❌ Get Plans failed with exception: {e}")
        results["Get Plans"] = False
    
    try:
        results["Create Vote"] = await test_vote_creation()
    except Exception as e:
        print(f"❌ Create Vote failed with exception: {e}")
        results["Create Vote"] = False
    
    try:
        results["Get Results"] = await test_get_results()
    except Exception as e:
        print(f"❌ Get Results failed with exception: {e}")
        results["Get Results"] = False
    
    # Summary
    print("\n📊 Test Results:")
    print("================")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is ready!")
        return True
    else:
        print("⚠️ Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = asyncio.run(run_backend_tests())
    exit(0 if success else 1) 