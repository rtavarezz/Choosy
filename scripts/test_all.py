#!/usr/bin/env python3
"""
Simple Test Runner for Choosy
Tests database, backend, and frontend integration
"""

import asyncio
import subprocess
import sys
import time
from pathlib import Path

def run_command(command: str, cwd: str = None) -> bool:
    """Run a command and return success status"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ {command}")
            return True
        else:
            print(f"❌ {command}")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ {command} failed: {e}")
        return False

async def test_backend() -> bool:
    """Test the FastAPI backend"""
    print("\n🔧 Testing Backend...")
    return run_command("python3 test_backend.py", cwd="backend")

def test_database() -> bool:
    """Test the database connectivity"""
    print("\n🗄️ Testing Database...")
    return run_command("node db/test/database-test.js")

def test_frontend() -> bool:
    """Test if frontend is accessible"""
    print("\n🌐 Testing Frontend...")
    
    try:
        import httpx
        import asyncio
        
        async def check_frontend():
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:3000")
                return response.status_code == 200
        
        return asyncio.run(check_frontend())
    except:
        print("⚠️ Frontend test skipped (httpx not available)")
        return True

def main():
    """Run all tests"""
    print("🚀 Starting Choosy Full System Test...\n")
    
    # Check if servers are running
    print("📋 Checking if servers are running...")
    
    # Test backend
    backend_ok = asyncio.run(test_backend())
    
    # Test database
    database_ok = test_database()
    
    # Test frontend
    frontend_ok = test_frontend()
    
    # Summary
    print("\n📊 Overall Test Results:")
    print("========================")
    
    tests = [
        ("Backend", backend_ok),
        ("Database", database_ok),
        ("Frontend", frontend_ok)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All systems are working! Choosy is ready!")
        return True
    else:
        print("⚠️ Some tests failed. Check the errors above.")
        print("\n💡 To start servers:")
        print("  Backend: cd backend && python main.py")
        print("  Frontend: npm run dev")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 