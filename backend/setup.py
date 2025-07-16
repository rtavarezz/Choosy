#!/usr/bin/env python3
"""
Setup script for Choosy backend
Helps configure environment and test database connection
"""
import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")

def check_python_dependencies():
    """Check if required Python packages are installed"""
    print_header("Checking Python Dependencies")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "psycopg2-binary",
        "sqlalchemy",
        "pydantic",
        "python-dotenv",
        "httpx",
        "python-multipart",
        "requests"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("\n✅ All Python dependencies are installed!")
    return True

def check_environment_file():
    """Check if .env file exists and has required variables"""
    print_header("Environment Configuration")
    
    # Check if .env exists in project root
    env_path = Path(__file__).parent.parent / ".env"
    env_local_path = Path(__file__).parent.parent / ".env.local"
    
    env_file = None
    if env_path.exists():
        env_file = env_path
        print(f"✅ Found .env file: {env_file}")
    elif env_local_path.exists():
        env_file = env_local_path
        print(f"✅ Found .env.local file: {env_file}")
    else:
        print("❌ No .env or .env.local file found")
        print("\n📝 Create a .env file in the project root with:")
        print("""
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Connection (for FastAPI)
DATABASE_URL=postgresql://postgres.your_project_ref:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# FastAPI Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true
        """)
        return False
    
    # Check required environment variables
    required_vars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_ROLE_KEY",
        "DATABASE_URL"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
            print(f"❌ {var} - MISSING")
        else:
            print(f"✅ {var}")
    
    if missing_vars:
        print(f"\n⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("Add them to your .env file")
        return False
    
    print("\n✅ All environment variables are set!")
    return True

def test_fastapi_server():
    """Test if FastAPI server can start"""
    print_header("Testing FastAPI Server")
    
    try:
        # Try to start the server in a subprocess
        process = subprocess.Popen(
            ["python3", "main.py"],
            cwd=Path(__file__).parent,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit for server to start
        import time
        time.sleep(3)
        
        # Check if process is still running
        if process.poll() is None:
            print("✅ FastAPI server started successfully")
            process.terminate()
            return True
        else:
            stdout, stderr = process.communicate()
            print(f"❌ FastAPI server failed to start")
            print(f"Error: {stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing FastAPI server: {e}")
        return False

def run_comprehensive_test():
    """Run the comprehensive test script"""
    print_header("Running Comprehensive Tests")
    
    try:
        result = subprocess.run(
            ["python3", "test_comprehensive.py"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True
        )
        
        print(result.stdout)
        if result.stderr:
            print(f"Errors: {result.stderr}")
        
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False

def main():
    """Main setup function"""
    print_header("CHOOSY BACKEND SETUP")
    
    checks = [
        ("Python Dependencies", check_python_dependencies),
        ("Environment Configuration", check_environment_file),
        ("FastAPI Server", test_fastapi_server),
        ("Comprehensive Tests", run_comprehensive_test),
    ]
    
    results = []
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"❌ {check_name}: ERROR - {str(e)}")
            results.append((check_name, False))
    
    # Summary
    print_header("SETUP SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for check_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{check_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 Setup complete! Your backend is ready to use.")
        print("\nNext steps:")
        print("1. Start the FastAPI server: cd backend && python main.py")
        print("2. Test the API: python test_comprehensive.py")
        print("3. Update Next.js to use FastAPI instead of Supabase")
    else:
        print(f"\n⚠️  {total-passed} check(s) failed. Fix the issues above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 