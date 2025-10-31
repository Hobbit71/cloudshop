"""Configuration settings for Notification Service."""
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "Notification Service"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cloudshop_notifications",
        env="DATABASE_URL"
    )
    database_pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=20, env="DATABASE_MAX_OVERFLOW")
    
    # Redis (for Celery broker and cache)
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    
    # Celery
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1",
        env="CELERY_BROKER_URL"
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/1",
        env="CELERY_RESULT_BACKEND"
    )
    
    # API
    api_prefix: str = "/api/v1"
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        env="CORS_ORIGINS"
    )
    
    # Auth
    auth_service_url: Optional[str] = Field(default=None, env="AUTH_SERVICE_URL")
    jwt_secret: Optional[str] = Field(default=None, env="JWT_SECRET")
    
    # Email (SendGrid)
    sendgrid_api_key: Optional[str] = Field(default=None, env="SENDGRID_API_KEY")
    sendgrid_from_email: str = Field(
        default="noreply@cloudshop.com",
        env="SENDGRID_FROM_EMAIL"
    )
    sendgrid_from_name: str = Field(
        default="CloudShop",
        env="SENDGRID_FROM_NAME"
    )
    
    # SMS (Twilio)
    twilio_account_sid: Optional[str] = Field(default=None, env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = Field(default=None, env="TWILIO_AUTH_TOKEN")
    twilio_from_number: Optional[str] = Field(default=None, env="TWILIO_FROM_NUMBER")
    
    # Push Notifications (Firebase FCM - optional, can use other providers)
    fcm_server_key: Optional[str] = Field(default=None, env="FCM_SERVER_KEY")
    fcm_project_id: Optional[str] = Field(default=None, env="FCM_PROJECT_ID")
    
    # Notification Settings
    enable_email: bool = Field(default=True, env="ENABLE_EMAIL")
    enable_sms: bool = Field(default=True, env="ENABLE_SMS")
    enable_push: bool = Field(default=True, env="ENABLE_PUSH")
    enable_in_app: bool = Field(default=True, env="ENABLE_IN_APP")
    
    # Retry Settings
    max_retries: int = Field(default=3, env="MAX_RETRIES")
    retry_delay: int = Field(default=60, env="RETRY_DELAY")  # seconds
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

