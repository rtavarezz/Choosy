"""
Centralized environment configuration for Choosy backend
Handles secure loading of environment variables
"""
import os
from dotenv import load_dotenv
from typing import Optional

class EnvironmentConfig:
    """Secure environment variable configuration"""
    
    def __init__(self):
        self._load_environment()
        self._validate_required_vars()
    
    def _load_environment(self):
        """Load environment variables from .env files"""
        # Try to load from main.env first (development)
        main_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'main.env')
        if os.path.exists(main_env_path):
            load_dotenv(main_env_path, override=True)
        else:
            # Fall back to default .env loading (production)
            load_dotenv()
    
    def _validate_required_vars(self):
        """Validate that critical environment variables are set"""
        required_vars = [
            'SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise EnvironmentError(
                f"Missing required environment variables: {', '.join(missing_vars)}\n"
                f"Please check your environment configuration."
            )
    
    @property
    def supabase_url(self) -> str:
        return os.getenv('SUPABASE_URL', '')
    
    @property
    def supabase_anon_key(self) -> str:
        return os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    
    @property
    def supabase_service_role_key(self) -> str:
        return os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
    
    @property
    def database_url(self) -> str:
        return os.getenv('DATABASE_URL', '')
    
    @property
    def eventbrite_api_key(self) -> Optional[str]:
        return os.getenv('EVENTBRITE_API_KEY')
    
    @property
    def ticketmaster_api_key(self) -> Optional[str]:
        return os.getenv('TICKETMASTER_API_KEY')
    
    @property
    def ticketmaster_api_secret(self) -> Optional[str]:
        return os.getenv('TICKETMASTER_API_SECRET')
    
    @property
    def unsplash_access_key(self) -> Optional[str]:
        return os.getenv('UNSPLASH_ACCESS_KEY')
    
    @property
    def unsplash_secret_key(self) -> Optional[str]:
        return os.getenv('UNSPLASH_SECRET_KEY')
    
    @property
    def backend_url(self) -> str:
        return os.getenv('BACKEND_URL', 'http://127.0.0.1:8000')
    
    @property
    def api_url(self) -> str:
        return os.getenv('NEXT_PUBLIC_API_URL', self.backend_url)
    
    def get_api_keys(self) -> dict:
        """Get all API keys for external services"""
        return {
            'eventbrite': self.eventbrite_api_key,
            'ticketmaster': self.ticketmaster_api_key,
            'unsplash': self.unsplash_access_key,
        }

# Global configuration instance
env_config = EnvironmentConfig()