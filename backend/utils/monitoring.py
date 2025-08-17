"""
Monitoring and Logging System
Comprehensive monitoring, logging, and alerting for the Choosy application
"""

import os
import time
import json
import logging
import traceback
from sqlalchemy import text
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from functools import wraps
from contextlib import contextmanager
import psutil
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """Monitor application performance and resource usage"""
    
    def __init__(self):
        self.metrics = {
            "request_count": 0,
            "error_count": 0,
            "response_times": [],
            "memory_usage": [],
            "cpu_usage": [],
            "database_connections": 0
        }
        self.start_time = time.time()
    
    def record_request(self, response_time: float, status_code: int):
        """Record a request metric"""
        self.metrics["request_count"] += 1
        self.metrics["response_times"].append(response_time)
        
        if status_code >= 400:
            self.metrics["error_count"] += 1
        
        # Keep only last 1000 response times
        if len(self.metrics["response_times"]) > 1000:
            self.metrics["response_times"] = self.metrics["response_times"][-1000:]
    
    def record_system_metrics(self):
        """Record system resource usage"""
        try:
            memory = psutil.virtual_memory()
            cpu = psutil.cpu_percent(interval=1)
            
            self.metrics["memory_usage"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "percent": memory.percent,
                "available": memory.available
            })
            
            self.metrics["cpu_usage"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "percent": cpu
            })
            
            # Keep only last 100 system metrics
            if len(self.metrics["memory_usage"]) > 100:
                self.metrics["memory_usage"] = self.metrics["memory_usage"][-100:]
            if len(self.metrics["cpu_usage"]) > 100:
                self.metrics["cpu_usage"] = self.metrics["cpu_usage"][-100:]
                
        except Exception as e:
            logger.error(f"Error recording system metrics: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        uptime = time.time() - self.start_time
        
        # Calculate averages
        avg_response_time = 0
        if self.metrics["response_times"]:
            avg_response_time = sum(self.metrics["response_times"]) / len(self.metrics["response_times"])
        
        error_rate = 0
        if self.metrics["request_count"] > 0:
            error_rate = (self.metrics["error_count"] / self.metrics["request_count"]) * 100
        
        return {
            "uptime_seconds": uptime,
            "request_count": self.metrics["request_count"],
            "error_count": self.metrics["error_count"],
            "error_rate_percent": error_rate,
            "avg_response_time_ms": avg_response_time * 1000,
            "memory_usage": self.metrics["memory_usage"][-1] if self.metrics["memory_usage"] else None,
            "cpu_usage": self.metrics["cpu_usage"][-1] if self.metrics["cpu_usage"] else None,
            "database_connections": self.metrics["database_connections"]
        }

class ErrorTracker:
    """Track and categorize application errors"""
    
    def __init__(self):
        self.errors = []
        self.error_counts = {}
        self.alert_threshold = 10  # Alert after 10 errors in 5 minutes
    
    def record_error(self, error: Exception, context: Dict[str, Any] = None):
        """Record an error with context"""
        error_info = {
            "timestamp": datetime.utcnow().isoformat(),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "traceback": traceback.format_exc(),
            "context": context or {}
        }
        
        self.errors.append(error_info)
        
        # Count errors by type
        error_type = type(error).__name__
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        
        # Check for alert conditions
        self._check_alerts()
        
        # Keep only last 1000 errors
        if len(self.errors) > 1000:
            self.errors = self.errors[-1000:]
    
    def _check_alerts(self):
        """Check if we need to send alerts"""
        recent_errors = [
            error for error in self.errors
            if datetime.fromisoformat(error["timestamp"]) > datetime.utcnow() - timedelta(minutes=5)
        ]
        
        if len(recent_errors) >= self.alert_threshold:
            self._send_alert(f"High error rate detected: {len(recent_errors)} errors in last 5 minutes")
    
    def _send_alert(self, message: str):
        """Send alert (placeholder for production alerting system)"""
        logger.warning(f"ALERT: {message}")
        # In production, this would send to Slack, email, etc.
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get error summary"""
        return {
            "total_errors": len(self.errors),
            "error_counts": self.error_counts,
            "recent_errors": self.errors[-10:] if self.errors else []
        }

class DatabaseMonitor:
    """Monitor database performance and connections"""
    
    def __init__(self, engine):
        self.engine = engine
        self.connection_pool = engine.pool
    
    def get_pool_status(self) -> Dict[str, Any]:
        """Get database connection pool status"""
        try:
            pool_status = {
                "pool_size": self.connection_pool.size(),
                "checked_in": self.connection_pool.checkedin(),
                "checked_out": self.connection_pool.checkedout(),
                "overflow": self.connection_pool.overflow()
            }
            
            # Only add invalid() for PostgreSQL pools (not available in SQLite)
            if hasattr(self.connection_pool, 'invalid'):
                pool_status["invalid"] = self.connection_pool.invalid()
            else:
                pool_status["invalid"] = 0  # SQLite doesn't track invalid connections
                
            return pool_status
        except Exception as e:
            logger.error(f"Error getting pool status: {e}")
            return {"error": str(e)}
    
    def check_connection_health(self) -> bool:
        """Check if database connection is healthy"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

class SecurityMonitor:
    """Monitor security-related events"""
    
    def __init__(self):
        self.security_events = []
        self.suspicious_ips = {}
        self.rate_limit_violations = {}
    
    def record_security_event(self, event_type: str, details: Dict[str, Any]):
        """Record a security event"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "details": details
        }
        
        self.security_events.append(event)
        
        # Check for suspicious patterns
        self._check_suspicious_activity(event)
        
        # Keep only last 1000 security events
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-1000:]
    
    def _check_suspicious_activity(self, event: Dict[str, Any]):
        """Check for suspicious activity patterns"""
        ip = event["details"].get("ip_address")
        if not ip:
            return
        
        # Track failed authentication attempts
        if event["event_type"] == "auth_failed":
            if ip not in self.suspicious_ips:
                self.suspicious_ips[ip] = {"auth_failures": 0, "last_attempt": None}
            
            self.suspicious_ips[ip]["auth_failures"] += 1
            self.suspicious_ips[ip]["last_attempt"] = datetime.utcnow()
            
            # Alert if too many failures
            if self.suspicious_ips[ip]["auth_failures"] >= 5:
                logger.warning(f"Suspicious activity detected from IP {ip}: {self.suspicious_ips[ip]['auth_failures']} auth failures")
    
    def get_security_summary(self) -> Dict[str, Any]:
        """Get security summary"""
        return {
            "total_events": len(self.security_events),
            "suspicious_ips": len(self.suspicious_ips),
            "recent_events": self.security_events[-10:] if self.security_events else []
        }

# Global monitoring instances
performance_monitor = PerformanceMonitor()
error_tracker = ErrorTracker()
security_monitor = SecurityMonitor()
database_monitor = None  # Will be set when engine is available

def monitor_performance(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            response_time = time.time() - start_time
            performance_monitor.record_request(response_time, 200)
            return result
        except Exception as e:
            response_time = time.time() - start_time
            performance_monitor.record_request(response_time, 500)
            error_tracker.record_error(e, {"function": func.__name__})
            raise
    return wrapper

@contextmanager
def monitor_operation(operation_name: str):
    """Context manager to monitor operations"""
    start_time = time.time()
    try:
        yield
        response_time = time.time() - start_time
        performance_monitor.record_request(response_time, 200)
    except Exception as e:
        response_time = time.time() - start_time
        performance_monitor.record_request(response_time, 500)
        error_tracker.record_error(e, {"operation": operation_name})
        raise

def log_user_action(user_id: str, action: str, details: Dict[str, Any] = None):
    """Log user actions for audit trail"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "action": action,
        "details": details or {}
    }
    
    logger.info(f"User action: {json.dumps(log_entry)}")

def log_security_event(event_type: str, details: Dict[str, Any]):
    """Log security events"""
    security_monitor.record_security_event(event_type, details)
    logger.warning(f"Security event: {event_type} - {json.dumps(details)}")

def get_health_status() -> Dict[str, Any]:
    """Get overall application health status"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "performance": performance_monitor.get_metrics(),
        "errors": error_tracker.get_error_summary(),
        "security": security_monitor.get_security_summary()
    }
    
    # Check database health
    if database_monitor:
        db_healthy = database_monitor.check_connection_health()
        health_status["database"] = {
            "healthy": db_healthy,
            "pool_status": database_monitor.get_pool_status()
        }
        if not db_healthy:
            health_status["status"] = "degraded"
    
    # Check error rate
    if health_status["performance"]["error_rate_percent"] > 5:
        health_status["status"] = "degraded"
    
    # Check memory usage
    if health_status["performance"]["memory_usage"]:
        if health_status["performance"]["memory_usage"]["percent"] > 90:
            health_status["status"] = "degraded"
    
    return health_status

def setup_monitoring(engine):
    """Setup monitoring with database engine"""
    global database_monitor
    database_monitor = DatabaseMonitor(engine)
    
    logger.info("Monitoring system initialized")

# Periodic monitoring tasks
def start_periodic_monitoring():
    """Start periodic monitoring tasks"""
    import threading
    import time
    
    def monitor_loop():
        while True:
            try:
                performance_monitor.record_system_metrics()
                time.sleep(60)  # Record metrics every minute
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(60)
    
    monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
    monitor_thread.start()
    logger.info("Periodic monitoring started") 