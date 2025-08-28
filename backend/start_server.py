#!/usr/bin/env python3
"""
Startup script for Choosy backend
Handles Python path setup and server startup
"""

import sys
import os
import uvicorn

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Add __init__.py files to make directories into packages
def create_init_files():
    """Create __init__.py files in all directories to make them Python packages"""
    directories = [
        'core',
        'engines', 
        'services',
        'utils'
    ]
    
    for directory in directories:
        init_file = os.path.join(backend_dir, directory, '__init__.py')
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('# Auto-generated __init__.py\n')
            print(f"✅ Created {init_file}")

def main():
    """Start the FastAPI server"""
    print("🚀 Starting Choosy Backend Server...")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🐍 Python path: {sys.path[0]}")
    
    # Create __init__.py files
    create_init_files()
    
    try:
        # Import the app
        from core.main import app
        
        print("✅ App imported successfully")
        print("🌐 Starting server on http://localhost:8000")
        print("📊 Health check: http://localhost:8000/")
        print("📚 API docs: http://localhost:8000/docs")
        
        # Start the server
        uvicorn.run(
            "core.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
        print("💡 Check that all import paths are correct")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 