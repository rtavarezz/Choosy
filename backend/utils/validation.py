"""
Input Validation and Sanitization Utilities
Comprehensive validation for all user inputs to prevent security vulnerabilities
"""

import re
import html
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import HTTPException, status

class ValidationError(Exception):
    """Custom validation error with detailed message"""
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")

class InputValidator:
    """Comprehensive input validation and sanitization"""
    
    # Regex patterns
    PHONE_PATTERN = re.compile(r'^\+?1?\d{9,15}$')
    ZIP_CODE_PATTERN = re.compile(r'^\d{5}(-\d{4})?$')
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    NAME_PATTERN = re.compile(r"^[a-zA-Z\s\-\.'’]{2,30}$")
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    
    # Banned words for content moderation
    BANNED_WORDS = {
        'admin', 'moderator', 'system', 'test', 'fake', 'spam', 'bot', 'robot',
        'hack', 'exploit', 'sql', 'injection', 'xss', 'script', 'javascript'
    }
    
    @staticmethod
    def sanitize_text(text: str, max_length: int = 1000) -> str:
        """Sanitize text input to prevent XSS and other attacks"""
        if not text:
            return ""
        
        # Convert to string if needed
        text = str(text)
        
        # Trim whitespace
        text = text.strip()
        
        # HTML escape to prevent XSS
        text = html.escape(text)
        
        # Remove null bytes and control characters
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # Truncate if too long
        if len(text) > max_length:
            text = text[:max_length]
        
        return text
    
    @staticmethod
    def validate_phone_number(phone: str) -> str:
        """Validate and normalize phone number"""
        if not phone:
            raise ValidationError("phone", "Phone number is required")
        
        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d+]', '', phone)
        
        # Ensure it starts with +1 for US numbers
        if not cleaned.startswith('+'):
            if cleaned.startswith('1') and len(cleaned) == 11:
                cleaned = '+' + cleaned
            else:
                cleaned = '+1' + cleaned
        
        # Validate format
        if not InputValidator.PHONE_PATTERN.match(cleaned):
            raise ValidationError("phone", "Invalid phone number format")
        
        return cleaned
    
    @staticmethod
    def validate_zip_code(zip_code: str) -> str:
        """Validate US zip code"""
        if not zip_code:
            raise ValidationError("zip_code", "Zip code is required")
        
        zip_code = zip_code.strip()
        
        if not InputValidator.ZIP_CODE_PATTERN.match(zip_code):
            raise ValidationError("zip_code", "Invalid zip code format (use 12345 or 12345-6789)")
        
        return zip_code
    
    @staticmethod
    def validate_name(name: str) -> str:
        """Validate user name"""
        if not name:
            raise ValidationError("name", "Name is required")
        
        name = name.strip()
        
        if len(name) < 2:
            raise ValidationError("name", "Name must be at least 2 characters long")
        
        if len(name) > 30:
            raise ValidationError("name", "Name must be 30 characters or less")
        
        if not InputValidator.NAME_PATTERN.match(name):
            raise ValidationError("name", "Name can only contain letters, spaces, hyphens, apostrophes, and periods")
        
        # Check for banned words
        name_lower = name.lower()
        for banned_word in InputValidator.BANNED_WORDS:
            if banned_word in name_lower:
                raise ValidationError("name", "Name contains inappropriate content")
        
        return name
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate email address"""
        if not email:
            raise ValidationError("email", "Email is required")
        
        email = email.strip().lower()
        
        if not InputValidator.EMAIL_PATTERN.match(email):
            raise ValidationError("email", "Invalid email format")
        
        return email
    
    @staticmethod
    def validate_uuid(uuid_str: str, field_name: str = "id") -> str:
        """Validate UUID format"""
        if not uuid_str:
            raise ValidationError(field_name, f"{field_name} is required")
        
        uuid_str = uuid_str.strip()
        
        if not InputValidator.UUID_PATTERN.match(uuid_str):
            raise ValidationError(field_name, f"Invalid {field_name} format")
        
        return uuid_str
    
    @staticmethod
    def validate_plan_data(plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate plan creation data"""
        validated = {}
        
        # Required fields
        if not plan_data.get("title"):
            raise ValidationError("title", "Plan title is required")
        
        if not plan_data.get("zip_code"):
            raise ValidationError("zip_code", "Zip code is required")
        
        # Validate and sanitize fields
        validated["title"] = InputValidator.sanitize_text(plan_data["title"], 100)
        validated["zip_code"] = InputValidator.validate_zip_code(plan_data["zip_code"])
        
        # Optional fields
        if plan_data.get("description"):
            validated["description"] = InputValidator.sanitize_text(plan_data["description"], 500)
        
        # Validate group size
        group_size = plan_data.get("group_size", "myself")
        if group_size not in ["myself", "2", "3+"]:
            raise ValidationError("group_size", "Group size must be 'myself', '2', or '3+'")
        validated["group_size"] = group_size
        
        return validated
    
    @staticmethod
    def validate_vote_data(vote_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate vote data"""
        validated = {}
        
        # Required fields
        if not vote_data.get("option_id"):
            raise ValidationError("option_id", "Option ID is required")
        
        if not vote_data.get("vote_type"):
            raise ValidationError("vote_type", "Vote type is required")
        
        # Validate option_id (should be UUID)
        validated["option_id"] = InputValidator.validate_uuid(vote_data["option_id"], "option_id")
        
        # Validate vote_type
        vote_type = vote_data["vote_type"]
        if vote_type not in ["like", "dislike", "super_like"]:
            raise ValidationError("vote_type", "Vote type must be 'like', 'dislike', or 'super_like'")
        validated["vote_type"] = vote_type
        
        return validated
    
    @staticmethod
    def validate_reservation_data(reservation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate reservation data"""
        validated = {}
        
        # Required fields
        if not reservation_data.get("name"):
            raise ValidationError("name", "Name is required")
        
        if not reservation_data.get("phone"):
            raise ValidationError("phone", "Phone number is required")
        
        # Validate and sanitize fields
        validated["name"] = InputValidator.validate_name(reservation_data["name"])
        validated["phone"] = InputValidator.validate_phone_number(reservation_data["phone"])
        
        # Validate group size
        group_size = reservation_data.get("group_size", "myself")
        if group_size not in ["myself", "2", "3+"]:
            raise ValidationError("group_size", "Group size must be 'myself', '2', or '3+'")
        validated["group_size"] = group_size
        
        return validated
    
    @staticmethod
    def validate_session_data(session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate session/verification data"""
        validated = {}
        
        # Required fields
        if not session_data.get("session_id"):
            raise ValidationError("session_id", "Session ID is required")
        
        if not session_data.get("code"):
            raise ValidationError("code", "Verification code is required")
        
        # Validate session_id format
        session_id = session_data["session_id"]
        if len(session_id) < 16 or len(session_id) > 64:
            raise ValidationError("session_id", "Invalid session ID format")
        validated["session_id"] = session_id
        
        # Validate verification code
        code = session_data["code"]
        if not code.isdigit() or len(code) != 6:
            raise ValidationError("code", "Verification code must be 6 digits")
        validated["code"] = code
        
        return validated

class ErrorHandler:
    """Centralized error handling for validation and business logic"""
    
    @staticmethod
    def handle_validation_error(error: ValidationError) -> HTTPException:
        """Convert validation error to HTTP exception"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "validation_error",
                "field": error.field,
                "message": error.message
            }
        )
    
    @staticmethod
    def handle_database_error(error: Exception, operation: str) -> HTTPException:
        """Handle database errors with appropriate logging"""
        from utils.logger import logger
        
        logger.error(f"Database error during {operation}: {error}")
        
        # Don't expose internal database errors to users
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )
    
    @staticmethod
    def handle_authentication_error(error: Exception) -> HTTPException:
        """Handle authentication errors"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    @staticmethod
    def handle_authorization_error(error: Exception) -> HTTPException:
        """Handle authorization errors"""
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    @staticmethod
    def handle_rate_limit_error() -> HTTPException:
        """Handle rate limiting errors"""
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

# Convenience functions for common validations
def validate_and_sanitize_input(data: Dict[str, Any], validation_type: str) -> Dict[str, Any]:
    """Validate and sanitize input based on type"""
    try:
        if validation_type == "plan":
            return InputValidator.validate_plan_data(data)
        elif validation_type == "vote":
            return InputValidator.validate_vote_data(data)
        elif validation_type == "reservation":
            return InputValidator.validate_reservation_data(data)
        elif validation_type == "session":
            return InputValidator.validate_session_data(data)
        else:
            raise ValueError(f"Unknown validation type: {validation_type}")
    except ValidationError as e:
        raise ErrorHandler.handle_validation_error(e)

def sanitize_user_input(text: str) -> str:
    """Quick sanitization for user input"""
    return InputValidator.sanitize_text(text)

def validate_phone(phone: str) -> str:
    """Quick phone validation"""
    try:
        return InputValidator.validate_phone_number(phone)
    except ValidationError as e:
        raise ErrorHandler.handle_validation_error(e)

def validate_zip(zip_code: str) -> str:
    """Quick zip code validation"""
    try:
        return InputValidator.validate_zip_code(zip_code)
    except ValidationError as e:
        raise ErrorHandler.handle_validation_error(e) 