#!/usr/bin/env python3
"""
Quick setup test for Choosy
Verifies all components can be imported and basic functionality works
"""

import sys
import subprocess
from pathlib import Path

def test_python_imports():
    """Test that backend dependencies can be imported"""
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✅ Python backend dependencies OK")
        return True
    except ImportError as e:
        print(f"❌ Python import error: {e}")
        return False

def test_backend_structure():
    """Test backend file structure"""
    backend_dir = Path("backend")
    required_files = [
        "start_server.py",
        "init_sqlite.py", 
        "requirements.txt",
        "core/main.py"
    ]
    
    missing = []
    for file in required_files:
        if not (backend_dir / file).exists():
            missing.append(file)
    
    if missing:
        print(f"❌ Missing backend files: {missing}")
        return False
    else:
        print("✅ Backend structure OK")
        return True

def test_frontend_structure():
    """Test frontend file structure"""
    frontend_dir = Path("frontend")
    required_files = [
        "package.json",
        "pages/index.tsx",
        "next.config.js"
    ]
    
    missing = []
    for file in required_files:
        if not (frontend_dir / file).exists():
            missing.append(file)
    
    if missing:
        print(f"❌ Missing frontend files: {missing}")
        return False
    else:
        print("✅ Frontend structure OK")
        return True

def test_node_availability():
    """Test Node.js and npm availability"""
    try:
        subprocess.check_output(["node", "--version"], stderr=subprocess.STDOUT, text=True)
        subprocess.check_output(["npm", "--version"], stderr=subprocess.STDOUT, text=True)
        print("✅ Node.js and npm available")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js or npm not available")
        return False

def main():
    print("🧪 Testing Choosy setup...\n")
    
    tests = [
        ("Backend structure", test_backend_structure),
        ("Frontend structure", test_frontend_structure), 
        ("Node.js availability", test_node_availability),
        ("Python imports", test_python_imports)
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_func in tests:
        print(f"Testing {name}...")
        if test_func():
            passed += 1
        print()
    
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Choosy is ready to launch!")
        print("Run: python3 start_choosy.py")
    else:
        print("⚠️ Some tests failed. Check the errors above.")
        print("Make sure you're in the Choosy root directory.")

if __name__ == "__main__":
    main()