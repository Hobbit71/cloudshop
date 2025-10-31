"""Notification model."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationType(str, Enum):
    """Notification type enumeration."""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"


class NotificationStatus(str, Enum):
    """Notification status enumeration."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    DELIVERED = "delivered"
    READ = "read"


class Notification(Base):
    """Notification model."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False)  # NotificationType
    status = Column(String, default=NotificationStatus.PENDING.value, nullable=False)
    channel = Column(String, nullable=False)  # email, sms, push, in_app
    recipient = Column(String, nullable=False)  # email address, phone number, device token, etc.
    subject = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    template_id = Column(Integer, ForeignKey("notification_templates.id"), nullable=True)
    metadata = Column(JSON, nullable=True)  # Additional data like order_id, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    template = relationship("NotificationTemplate", back_populates="notifications")
    delivery_trackings = relationship("DeliveryTracking", back_populates="notification")

