#!/usr/bin/env python3
"""
Test Runner for Choosy Backend
Runs all tests and provides a comprehensive summary
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def run_tests():
    """Run all tests and return results"""
    print("🧪 Running Choosy Backend Tests...")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Create logs directory if it doesn't exist
    logs_dir = backend_dir / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    # Run tests with coverage
    test_commands = [
        ["python", "-m", "pytest", "tests/", "-v", "--tb=short"],
        ["python", "-m", "pytest", "tests/test_auth.py", "-v", "--tb=short"],
    ]
    
    results = []
    
    for cmd in test_commands:
        print(f"\n🔍 Running: {' '.join(cmd)}")
        print("-" * 30)
        
        start_time = time.time()
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            duration = time.time() - start_time
            
            results.append({
                "command": cmd,
                "return_code": result.return_code,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration": duration,
                "success": result.return_code == 0
            })
            
            print(f"✅ Test completed in {duration:.2f}s")
            if result.stdout:
                print("Output:")
                print(result.stdout)
            if result.stderr:
                print("Errors:")
                print(result.stderr)
                
        except subprocess.TimeoutExpired:
            print("❌ Test timed out after 5 minutes")
            results.append({
                "command": cmd,
                "return_code": -1,
                "stdout": "",
                "stderr": "Test timed out",
                "duration": 300,
                "success": False
            })
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append({
                "command": cmd,
                "return_code": -1,
                "stdout": "",
                "stderr": str(e),
                "duration": 0,
                "success": False
            })
    
    return results

def print_summary(results):
    """Print test summary"""
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    total_tests = len(results)
    successful_tests = sum(1 for r in results if r["success"])
    failed_tests = total_tests - successful_tests
    
    print(f"Total test suites: {total_tests}")
    print(f"✅ Successful: {successful_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success rate: {(successful_tests/total_tests)*100:.1f}%")
    
    if failed_tests > 0:
        print("\n❌ FAILED TESTS:")
        for result in results:
            if not result["success"]:
                print(f"  - {' '.join(result['command'])}")
                if result["stderr"]:
                    print(f"    Error: {result['stderr']}")
    
    print("\n" + "=" * 50)
    
    return successful_tests == total_tests

def main():
    """Main test runner"""
    print("🚀 Choosy Backend Test Suite")
    print("Testing authentication, validation, and monitoring systems...")
    
    # Run tests
    results = run_tests()
    
    # Print summary
    all_passed = print_summary(results)
    
    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main() 