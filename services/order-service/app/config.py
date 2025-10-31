"""Configuration settings for Order Service."""
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "Order Service"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cloudshop_orders",
        env="DATABASE_URL"
    )
    database_pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=20, env="DATABASE_MAX_OVERFLOW")
    
    # API
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        env="CORS_ORIGINS"
    )
    
    # Auth
    auth_service_url: Optional[str] = Field(default=None, env="AUTH_SERVICE_URL")
    jwt_secret: Optional[str] = Field(default=None, env="JWT_SECRET")
    
    # External Services
    product_service_url: Optional[str] = Field(
        default="http://localhost:8080",
        env="PRODUCT_SERVICE_URL"
    )
    payment_service_url: Optional[str] = Field(
        default="http://localhost:8081",
        env="PAYMENT_SERVICE_URL"
    )
    notification_service_url: Optional[str] = Field(
        default=None,
        env="NOTIFICATION_SERVICE_URL"
    )
    
    # Shipping
    shipping_base_rate: float = Field(default=5.99, env="SHIPPING_BASE_RATE")
    shipping_free_threshold: float = Field(default=50.00, env="SHIPPING_FREE_THRESHOLD")
    
    # Tax
    tax_rate: float = Field(default=0.08, env="TAX_RATE")
    
    # Feature Flags
    enable_notifications: bool = Field(default=True, env="ENABLE_NOTIFICATIONS")
    enable_shipping_calculation: bool = Field(default=True, env="ENABLE_SHIPPING_CALCULATION")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

