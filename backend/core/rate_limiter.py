"""
Simple Rate Limiter for Choosy API
Prevents abuse and protects the API from spam
"""

import time
from collections import defaultdict
from typing import Dict, Tuple
import threading

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
        
        # Rate limits - Increased for development
        self.requests_per_minute = 1000  # Increased from 100 for development
        self.requests_per_hour = 10000   # Increased from 1000 for development
        
    def is_allowed(self, client_id: str) -> Tuple[bool, Dict]:
        """Check if request is allowed based on rate limits"""
        current_time = time.time()
        
        with self.lock:
            # Clean old requests
            self._clean_old_requests(client_id, current_time)
            
            # Check minute limit
            minute_requests = len([req for req in self.requests[client_id] 
                                 if current_time - req < 60])
            
            # Check hour limit
            hour_requests = len([req for req in self.requests[client_id] 
                               if current_time - req < 3600])
            
            # Check limits
            if minute_requests >= self.requests_per_minute:
                return False, {
                    "error": "Rate limit exceeded",
                    "message": "Too many requests per minute",
                    "retry_after": 60
                }
            
            if hour_requests >= self.requests_per_hour:
                return False, {
                    "error": "Rate limit exceeded", 
                    "message": "Too many requests per hour",
                    "retry_after": 3600
                }
            
            # Add current request
            self.requests[client_id].append(current_time)
            
            return True, {
                "remaining_minute": self.requests_per_minute - minute_requests - 1,
                "remaining_hour": self.requests_per_hour - hour_requests - 1
            }
    
    def _clean_old_requests(self, client_id: str, current_time: float):
        """Remove requests older than 1 hour"""
        self.requests[client_id] = [
            req for req in self.requests[client_id] 
            if current_time - req < 3600
        ]

# Global rate limiter instance
rate_limiter = RateLimiter()

def get_client_id(request) -> str:
    """Get client identifier for rate limiting"""
    # Use IP address as client ID
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    return request.client.host if request.client else "unknown" 