#!/usr/bin/env python3
"""
Script to help get Supabase database connection string
"""
import os

def get_connection_string():
    """Get the database connection string from environment"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        print("❌ Missing environment variables")
        print("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
        return None
    
    # Extract project ID from URL
    # URL format: https://yyvfddsmunrsduihpegt.supabase.co
    project_id = url.split("//")[1].split(".")[0]
    
    # You'll need to get the password from Supabase dashboard
    # Go to Settings > Database > Connection string
    connection_string = f"postgresql://postgres.{project_id}:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    
    print("🔗 Database Connection String:")
    print("=" * 50)
    print(connection_string)
    print("=" * 50)
    print("\n📝 Instructions:")
    print("1. Go to your Supabase dashboard")
    print("2. Settings > Database")
    print("3. Copy the connection string")
    print("4. Replace YOUR_PASSWORD with the actual password")
    print("5. Add it to backend/.env as DATABASE_URL")
    
    return connection_string

if __name__ == "__main__":
    get_connection_string() 