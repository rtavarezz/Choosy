#!/usr/bin/env python3
"""
Choosy Startup Script
Copyright (c) 2024 rtavarezz

Starts both backend and frontend servers with style.
Licensed under MIT License - see LICENSE file.
"""

import os
import sys
import time
import subprocess
from pathlib import Path

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_logo():
    """Print cool Choosy logo with colors"""
    logo = f"""
{Colors.OKCYAN}////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////                                                                                      ////
////    {Colors.BOLD}{Colors.OKGREEN}  ██████╗██╗  ██╗ ██████╗  ██████╗ ███████╗██╗   ██╗                     {Colors.ENDC}{Colors.OKCYAN}    ////
////    {Colors.BOLD}{Colors.OKGREEN} ██╔════╝██║  ██║██╔═══██╗██╔═══██╗██╔════╝╚██╗ ██╔╝                     {Colors.ENDC}{Colors.OKCYAN}    ////
////    {Colors.BOLD}{Colors.OKGREEN} ██║     ███████║██║   ██║██║   ██║███████╗ ╚████╔╝                      {Colors.ENDC}{Colors.OKCYAN}    ////
////    {Colors.BOLD}{Colors.OKGREEN} ██║     ██╔══██║██║   ██║██║   ██║╚════██║  ╚██╔╝                       {Colors.ENDC}{Colors.OKCYAN}    ////
////    {Colors.BOLD}{Colors.OKGREEN} ╚██████╗██║  ██║╚██████╔╝╚██████╔╝███████║   ██║                        {Colors.ENDC}{Colors.OKCYAN}    ////
////    {Colors.BOLD}{Colors.OKGREEN}  ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝                        {Colors.ENDC}{Colors.OKCYAN}    ////
////                                                                                      ////
////    {Colors.BOLD}{Colors.WARNING}🎉 Group Decision Making Platform - Ready to Launch! 🎉                     {Colors.ENDC}{Colors.OKCYAN}    ////
////                                                                                      ////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////{Colors.ENDC}
"""
    print(logo)

def print_status(message, status="INFO"):
    """Print colored status messages"""
    if status == "SUCCESS":
        color = Colors.OKGREEN
        icon = "✅"
    elif status == "ERROR":
        color = Colors.FAIL
        icon = "❌"
    elif status == "WARNING":
        color = Colors.WARNING
        icon = "⚠️ "
    else:
        color = Colors.OKBLUE
        icon = "🔧"
    
    print(f"{color}{icon} {message}{Colors.ENDC}")

def check_dependencies():
    """Check if required dependencies are available"""
    print_status("Checking dependencies...")
    
    # Check Python
    try:
        python_version = subprocess.check_output([sys.executable, "--version"], text=True).strip()
        print_status(f"Python: {python_version}", "SUCCESS")
    except:
        print_status("Python not found!", "ERROR")
        return False
    
    # Check Node.js
    try:
        node_version = subprocess.check_output(["node", "--version"], text=True).strip()
        print_status(f"Node.js: {node_version}", "SUCCESS")
    except:
        print_status("Node.js not found! Please install Node.js", "ERROR")
        return False
    
    # Check npm
    try:
        npm_version = subprocess.check_output(["npm", "--version"], text=True).strip()
        print_status(f"npm: v{npm_version}", "SUCCESS")
    except:
        print_status("npm not found!", "ERROR")
        return False
    
    return True

def setup_backend(backend_dir):
    """Setup and start backend server"""
    print_status("Setting up backend environment...")
    
    # Create environment file if it doesn't exist
    env_file = backend_dir / "main.env"
    env_example = backend_dir / "main.env.example"
    if not env_file.exists() and env_example.exists():
        print_status("Creating backend environment file...")
        subprocess.run(["cp", str(env_example), str(env_file)], check=True)
        print_status("✅ Created main.env - You can add API keys later for live events!", "SUCCESS")
    
    # Check if virtual environment exists
    venv_path = backend_dir / "venv"
    if not venv_path.exists():
        print_status("Creating Python virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=backend_dir, check=True)
    
    # Install Python dependencies
    if (backend_dir / "requirements.txt").exists():
        print_status("Installing Python dependencies...")
        if sys.platform == "win32":
            pip_cmd = str(venv_path / "Scripts" / "pip")
            python_cmd = str(venv_path / "Scripts" / "python")
        else:
            pip_cmd = str(venv_path / "bin" / "pip")
            python_cmd = str(venv_path / "bin" / "python")
        
        subprocess.run([pip_cmd, "install", "-r", "requirements.txt"], cwd=backend_dir, check=True)
        print_status("Backend dependencies installed!", "SUCCESS")
    
    # Initialize database if needed
    if (backend_dir / "init_sqlite.py").exists():
        print_status("Initializing SQLite database...")
        subprocess.run([python_cmd, "init_sqlite.py"], cwd=backend_dir)
        print_status("Database ready!", "SUCCESS")
    
    # Start backend server
    print_status("Starting Choosy backend server...")
    backend_log = open("choosy-backend.log", "w")
    backend_proc = subprocess.Popen(
        [python_cmd, "start_server.py"],
        cwd=backend_dir,
        stdout=backend_log,
        stderr=subprocess.STDOUT
    )
    
    return backend_proc, backend_log

def setup_frontend(frontend_dir):
    """Setup and start frontend server"""
    print_status("Setting up frontend environment...")
    
    # Create environment file if it doesn't exist
    env_file = frontend_dir / ".env.local"
    env_example = frontend_dir / ".env.example"
    if not env_file.exists() and env_example.exists():
        print_status("Creating frontend environment file...")
        subprocess.run(["cp", str(env_example), str(env_file)], check=True)
        print_status("✅ Created .env.local with default settings!", "SUCCESS")
    
    # Install npm dependencies
    if (frontend_dir / "package.json").exists():
        print_status("Installing Node.js dependencies...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        print_status("Frontend dependencies installed!", "SUCCESS")
    
    # Start frontend server
    print_status("Starting Choosy frontend (Next.js)...")
    frontend_log = open("choosy-frontend.log", "w")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        stdout=frontend_log,
        stderr=subprocess.STDOUT
    )
    
    return frontend_proc, frontend_log

def main():
    """Main startup function"""
    print_logo()
    
    # Get project directories
    root_dir = Path(__file__).parent.resolve()
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir / "frontend"
    
    # Check if directories exist
    if not backend_dir.exists():
        print_status("Backend directory not found!", "ERROR")
        sys.exit(1)
    
    if not frontend_dir.exists():
        print_status("Frontend directory not found!", "ERROR")
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        print_status("Missing dependencies. Please install required software.", "ERROR")
        sys.exit(1)
    
    print_status("All dependencies found!", "SUCCESS")
    time.sleep(1)
    
    try:
        # Setup and start backend
        backend_proc, backend_log = setup_backend(backend_dir)
        time.sleep(3)  # Give backend time to start
        
        # Setup and start frontend
        frontend_proc, frontend_log = setup_frontend(frontend_dir)
        time.sleep(2)  # Give frontend time to start
        
        # Success message
        print(f"""
{Colors.BOLD}{Colors.OKGREEN}🚀 Choosy is now running! 🚀{Colors.ENDC}

{Colors.OKCYAN}📊 Backend API:  {Colors.BOLD}http://localhost:8000{Colors.ENDC}{Colors.OKCYAN} (logs: choosy-backend.log){Colors.ENDC}
{Colors.OKCYAN}🌐 Frontend App: {Colors.BOLD}http://localhost:3000{Colors.ENDC}{Colors.OKCYAN} (logs: choosy-frontend.log){Colors.ENDC}

{Colors.WARNING}💡 Features available:{Colors.ENDC}
   • Group event planning
   • Real-time voting system  
   • Location-based event discovery
   • Mobile-responsive interface

{Colors.BOLD}{Colors.HEADER}Press Ctrl+C to stop both servers{Colors.ENDC}
""")
        
        # Keep script running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print(f"\n{Colors.WARNING}🛑 Shutting down Choosy servers...{Colors.ENDC}")
            backend_proc.terminate()
            frontend_proc.terminate()
            backend_log.close()
            frontend_log.close()
            print_status("Choosy stopped successfully!", "SUCCESS")
            
    except subprocess.CalledProcessError as e:
        print_status(f"Error starting servers: {e}", "ERROR")
        sys.exit(1)
    except Exception as e:
        print_status(f"Unexpected error: {e}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()