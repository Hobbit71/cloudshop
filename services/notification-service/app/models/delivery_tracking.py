"""Delivery tracking model."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class DeliveryTracking(Base):
    """Delivery tracking model for notifications."""
    __tablename__ = "delivery_trackings"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)  # sent, delivered, opened, clicked, failed, etc.
    provider_response = Column(Text, nullable=True)  # Response from external provider
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    metadata = Column(Text, nullable=True)  # Additional tracking data
    
    # Relationships
    notification = relationship("Notification", back_populates="delivery_trackings")

