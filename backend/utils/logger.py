"""
Simple Logging System for Choosy
Essential for debugging production issues
"""

import logging
import os
from datetime import datetime
from typing import Optional

# Configure logging
def setup_logger(name: str = "choosy") -> logging.Logger:
    """Setup logger with file and console output"""
    
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )
    
    # File handler (daily rotation)
    today = datetime.now().strftime("%Y-%m-%d")
    file_handler = logging.FileHandler(f"logs/choosy-{today}.log")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(file_formatter)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    
    # Add handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# Global logger instance
logger = setup_logger()

def log_api_request(method: str, url: str, status_code: int, duration: float, user_id: Optional[str] = None):
    """Log API request details"""
    logger.info(f"API {method} {url} - {status_code} - {duration:.3f}s - User: {user_id or 'anonymous'}")

def log_error(error: Exception, context: str = "", user_id: Optional[str] = None):
    """Log errors with context"""
    logger.error(f"ERROR in {context}: {str(error)} - User: {user_id or 'anonymous'}")

def log_user_action(action: str, user_id: str, details: dict = None):
    """Log user actions for analytics"""
    details_str = f" - {details}" if details else ""
    logger.info(f"USER ACTION: {action} - User: {user_id}{details_str}")

def log_ai_recommendation(user_id: str, category: str, confidence: float, event_count: int):
    """Log AI recommendation events"""
    logger.info(f"AI RECOMMENDATION: User {user_id} - Category: {category} - Confidence: {confidence:.2f} - Events: {event_count}")

def log_gamification(user_id: str, action: str, points_awarded: int, new_total: int):
    """Log gamification events"""
    logger.info(f"GAMIFICATION: User {user_id} - Action: {action} - Points: +{points_awarded} - Total: {new_total}") 