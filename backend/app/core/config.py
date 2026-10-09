"""Core application configuration module."""

from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "GeoMeasure Pro API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./geomeasure.db"
    
    # File Upload Limits
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB
    MAX_FEATURES_PER_FILE: int = 25000
    
    # Temporary directory for file extraction
    TEMP_DIR_ROOT: str = "/tmp/geomeasure_uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
