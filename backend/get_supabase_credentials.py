#!/usr/bin/env python3
"""
Helper script to get Supabase credentials and set up environment
"""
import os
import sys
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")

def get_supabase_instructions():
    """Print instructions for getting Supabase credentials"""
    print_header("SUPABASE CREDENTIALS SETUP")
    
    print("""
📋 To get your Supabase credentials:

1. Go to https://supabase.com and sign in
2. Create a new project or select existing one
3. Go to Settings → API
4. Copy these values:

   🔑 Project URL: 
   (Looks like: https://your-project-ref.supabase.co)

   🔑 anon/public key: 
   (Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)

   🔑 service_role key: 
   (Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)

5. Go to Settings → Database
6. Copy the connection string:
   (Looks like: postgresql://postgres.your-project-ref:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres)

7. Create a .env file in your project root with:

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres

8. Run the database setup:
   cd db && npm run setup

9. Test the connection:
   cd backend && python setup.py
""")

def check_env_file():
    """Check if .env file exists"""
    env_path = Path(__file__).parent.parent / ".env"
    env_local_path = Path(__file__).parent.parent / ".env.local"
    
    if env_path.exists():
        print(f"✅ Found .env file: {env_path}")
        return True
    elif env_local_path.exists():
        print(f"✅ Found .env.local file: {env_local_path}")
        return True
    else:
        print("❌ No .env or .env.local file found")
        return False

def main():
    """Main function"""
    print_header("CHOOSY SUPABASE SETUP")
    
    if check_env_file():
        print("\n✅ Environment file exists!")
        print("Run: cd backend && python setup.py")
    else:
        get_supabase_instructions()

if __name__ == "__main__":
    main() 