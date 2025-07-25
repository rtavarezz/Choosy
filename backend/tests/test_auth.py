"""
Authentication System Tests
Tests for user authentication, JWT tokens, and session management
"""

import pytest
import jwt
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.main import app
from core.auth_system import AuthSystem, SessionManager, MockSMSService
from utils.validation import InputValidator, ValidationError

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

client = TestClient(app)

class TestAuthSystem:
    """Test authentication system functionality"""
    
    def setup_method(self):
        """Setup test environment"""
        # Create test tables
        from core.main import Base
        Base.metadata.create_all(bind=engine)
    
    def teardown_method(self):
        """Cleanup test environment"""
        # Drop test tables
        from core.main import Base
        Base.metadata.drop_all(bind=engine)
        # Clear session storage
        SessionManager._verification_codes.clear()
    
    def test_create_access_token(self):
        """Test JWT access token creation"""
        user_id = "test-user-123"
        user_phone = "+1234567890"
        
        token = AuthSystem.create_access_token(user_id, user_phone)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Verify token can be decoded
        payload = AuthSystem.verify_token(token)
        assert payload["sub"] == user_id
        assert payload["phone"] == user_phone
        assert payload["type"] == "access"
    
    def test_create_refresh_token(self):
        """Test JWT refresh token creation"""
        user_id = "test-user-123"
        
        token = AuthSystem.create_refresh_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Verify token can be decoded
        payload = AuthSystem.verify_token(token)
        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"
    
    def test_verify_expired_token(self):
        """Test handling of expired tokens"""
        # Create a token that expires immediately
        with patch('core.auth_system.ACCESS_TOKEN_EXPIRE_MINUTES', 0):
            token = AuthSystem.create_access_token("test-user", "+1234567890")
        
        # Token should be expired
        with pytest.raises(Exception):
            AuthSystem.verify_token(token)
    
    def test_verify_invalid_token(self):
        """Test handling of invalid tokens"""
        with pytest.raises(Exception):
            AuthSystem.verify_token("invalid-token")

class TestSessionManager:
    """Test session management functionality"""
    
    def setup_method(self):
        """Setup test environment"""
        SessionManager._verification_codes.clear()
    
    def test_create_verification_session(self):
        """Test creating a verification session"""
        phone = "+1234567890"
        
        session_id = SessionManager.create_verification_session(phone)
        
        assert session_id is not None
        assert session_id in SessionManager._verification_codes
        
        session = SessionManager._verification_codes[session_id]
        assert session["phone"] == phone
        assert session["verified"] == False
        assert session["attempts"] == 0
    
    def test_verify_session_code_success(self):
        """Test successful code verification"""
        phone = "+1234567890"
        session_id = SessionManager.create_verification_session(phone)
        
        session = SessionManager._verification_codes[session_id]
        code = session["code"]
        
        result = SessionManager.verify_session_code(session_id, code)
        assert result == True
        
        session = SessionManager._verification_codes[session_id]
        assert session["verified"] == True
    
    def test_verify_session_code_invalid(self):
        """Test invalid code verification"""
        phone = "+1234567890"
        session_id = SessionManager.create_verification_session(phone)
        
        result = SessionManager.verify_session_code(session_id, "000000")
        assert result == False
    
    def test_verify_session_code_expired(self):
        """Test expired session handling"""
        phone = "+1234567890"
        session_id = SessionManager.create_verification_session(phone)
        
        # Manually expire the session
        SessionManager._verification_codes[session_id]["created_at"] = datetime.utcnow() - timedelta(minutes=20)
        
        session = SessionManager._verification_codes[session_id]
        code = session["code"]
        
        result = SessionManager.verify_session_code(session_id, code)
        assert result == False
        assert session_id not in SessionManager._verification_codes
    
    def test_verify_session_code_too_many_attempts(self):
        """Test too many attempts handling"""
        phone = "+1234567890"
        session_id = SessionManager.create_verification_session(phone)
        
        # Try 3 times with wrong code
        for _ in range(3):
            SessionManager.verify_session_code(session_id, "000000")
        
        # Session should be deleted
        assert session_id not in SessionManager._verification_codes

class TestMockSMSService:
    """Test mock SMS service functionality"""
    
    def test_generate_verification_code(self):
        """Test verification code generation"""
        code = MockSMSService.generate_verification_code()
        
        assert len(code) == 6
        assert code.isdigit()
    
    def test_verify_code_valid(self):
        """Test valid code verification"""
        valid_codes = ["123456", "000000", "999999"]
        
        for code in valid_codes:
            assert MockSMSService.verify_code("+1234567890", code) == True
    
    def test_verify_code_invalid(self):
        """Test invalid code verification"""
        invalid_codes = ["12345", "1234567", "abcdef", "12 345", ""]
        
        for code in invalid_codes:
            assert MockSMSService.verify_code("+1234567890", code) == False

class TestAuthEndpoints:
    """Test authentication API endpoints"""
    
    def setup_method(self):
        """Setup test environment"""
        SessionManager._verification_codes.clear()
    
    def test_send_verification_code_success(self):
        """Test successful verification code sending"""
        response = client.post("/api/auth/send-code", params={"phone": "+1234567890"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "session_id" in data
        assert data["message"] == "Verification code sent"
    
    def test_send_verification_code_invalid_phone(self):
        """Test sending code with invalid phone number"""
        response = client.post("/api/auth/send-code", params={"phone": "invalid"})
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"] == "validation_error"
        assert "phone" in data["detail"]["field"]
        assert "Invalid phone number" in data["detail"]["message"]
    
    def test_verify_code_success(self):
        """Test successful code verification"""
        # First send a code
        send_response = client.post("/api/auth/send-code", params={"phone": "+1234567890"})
        session_id = send_response.json()["session_id"]
        
        # Get the code from session
        session = SessionManager._verification_codes[session_id]
        code = session["code"]
        
        # Verify the code
        response = client.post("/api/auth/verify-code", json={
            "session_id": session_id,
            "code": code
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user_id" in data
        assert "user_name" in data
        assert "phone" in data
    
    def test_verify_code_invalid_session(self):
        """Test verification with invalid session"""
        response = client.post("/api/auth/verify-code", json={
            "session_id": "invalid-session",
            "code": "123456"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"] == "validation_error"
        assert "session_id" in data["detail"]["field"]
        assert "Invalid session ID" in data["detail"]["message"]
    
    def test_verify_code_invalid_code(self):
        """Test verification with invalid code"""
        # First send a code
        send_response = client.post("/api/auth/send-code", params={"phone": "+1234567890"})
        session_id = send_response.json()["session_id"]
        
        # Try with wrong code
        response = client.post("/api/auth/verify-code", json={
            "session_id": session_id,
            "code": "000000"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"] == "validation_error"
        assert "code" in data["detail"]["field"]
        assert "Invalid or expired verification code" in data["detail"]["message"]

class TestInputValidation:
    """Test input validation functionality"""
    
    def test_validate_phone_number_valid(self):
        """Test valid phone number validation"""
        valid_phones = [
            "+1234567890",
            "1234567890",
            "+1-234-567-8900",
            "(123) 456-7890"
        ]
        
        for phone in valid_phones:
            validated = InputValidator.validate_phone_number(phone)
            assert validated.startswith("+1")
    
    def test_validate_phone_number_invalid(self):
        """Test invalid phone number validation"""
        invalid_phones = [
            "",
            "123",
            "abcdef",
            "+12345678901234567890"  # Too long
        ]
        
        for phone in invalid_phones:
            with pytest.raises(ValidationError):
                InputValidator.validate_phone_number(phone)
    
    def test_validate_zip_code_valid(self):
        """Test valid zip code validation"""
        valid_zips = ["12345", "12345-6789"]
        
        for zip_code in valid_zips:
            validated = InputValidator.validate_zip_code(zip_code)
            assert validated == zip_code
    
    def test_validate_zip_code_invalid(self):
        """Test invalid zip code validation"""
        invalid_zips = ["", "1234", "123456", "abcde", "12345-123"]
        
        for zip_code in invalid_zips:
            with pytest.raises(ValidationError):
                InputValidator.validate_zip_code(zip_code)
    
    def test_validate_name_valid(self):
        """Test valid name validation"""
        valid_names = ["John", "Mary Jane", "O'Connor", "Dr. Smith"]
        
        for name in valid_names:
            validated = InputValidator.validate_name(name)
            assert validated == name
    
    def test_validate_name_invalid(self):
        """Test invalid name validation"""
        invalid_names = [
            "",
            "A",  # Too short
            "This name is way too long and exceeds the maximum allowed length",
            "John123",  # Contains numbers
            "admin",  # Banned word
            "test user"  # Banned word
        ]
        
        for name in invalid_names:
            with pytest.raises(ValidationError):
                InputValidator.validate_name(name)
    
    def test_sanitize_text(self):
        """Test text sanitization"""
        # Test XSS prevention
        malicious_text = "<script>alert('xss')</script>"
        sanitized = InputValidator.sanitize_text(malicious_text)
        assert "<script>" not in sanitized
        assert "&lt;script&gt;" in sanitized
        
        # Test length truncation
        long_text = "a" * 2000
        sanitized = InputValidator.sanitize_text(long_text, max_length=100)
        assert len(sanitized) <= 100
        
        # Test null byte removal
        text_with_nulls = "Hello\x00World"
        sanitized = InputValidator.sanitize_text(text_with_nulls)
        assert "\x00" not in sanitized

if __name__ == "__main__":
    pytest.main([__file__]) 