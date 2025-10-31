"""Address model."""
from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.database import Base


class Address(Base):
    """Address model stored as JSONB in Order."""
    __tablename__ = "addresses"
    
    # Note: This is a simplified version. In production, you might want
    # to store addresses separately with proper normalization.
    # For now, we'll use JSONB in the Order model
    pass

