"""Notification template model."""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationTemplate(Base):
    """Notification template model."""
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    channel = Column(String, nullable=False)  # email, sms, push, in_app
    subject_template = Column(String, nullable=True)  # For email
    body_template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)  # Expected variables in template
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    notifications = relationship("Notification", back_populates="template")

