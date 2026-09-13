import os
import sys
import logging
from typing import List
from pydantic_settings import BaseSettings

logger = logging.getLogger("jansahaya.config")

INSECURE_SECRET_PATTERNS = [
    "jansahaya-super-secret",
    "jansahaya-v2-production",
    "secret",
    "default",
    "123456",
    "development",
    "changeme",
]

def get_cors_origins() -> List[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "")
    if raw_origins.strip():
        origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
        # NEVER allow wildcard "*" with credentialed requests
        filtered = [o for o in origins if o != "*"]
        if filtered:
            return filtered
    # Safe defaults for local development
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

class Settings(BaseSettings):
    PROJECT_NAME: str = "JanSahaya API & AI Services"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))
    
    SECRET_KEY: str = os.getenv("JWT_SECRET", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/jansahaya?schema=public")
    BACKEND_CORS_ORIGINS: List[str] = get_cors_origins()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

    def validate_production_security(self):
        """Validates critical security variables when deployed in production."""
        is_prod = self.ENVIRONMENT.lower() == "production"
        
        # 1. JWT Secret Validation
        if is_prod:
            if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
                logger.critical("FATAL: In production, JWT_SECRET must be set and at least 32 characters long.")
                sys.exit(1)
            for pattern in INSECURE_SECRET_PATTERNS:
                if pattern in self.SECRET_KEY.lower():
                    logger.critical("FATAL: Insecure or default JWT_SECRET detected in production environment.")
                    sys.exit(1)
        elif not self.SECRET_KEY:
            # Development fallback with warning
            logger.warning("WARNING: JWT_SECRET not configured. Using temporary development key.")
            self.SECRET_KEY = "jansahaya-dev-local-only-jwt-secret-key-32chars"

        # 2. Database URL Validation
        if is_prod:
            if not self.DATABASE_URL or "postgres:postgres@" in self.DATABASE_URL:
                logger.critical("FATAL: Default database credentials detected in production environment.")
                sys.exit(1)

        # 3. CORS Origins Validation
        if "*" in self.BACKEND_CORS_ORIGINS:
            logger.critical("FATAL: Wildcard CORS '*' cannot be used with credentialed requests.")
            sys.exit(1)

settings = Settings()
settings.validate_production_security()
