"""Notification schemas."""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    user_id: str = Field(..., description="User ID")
    channel: str = Field(..., description="Notification channel (email, sms, push, in_app)")
    recipient: str = Field(..., description="Recipient address (email, phone, device token)")
    subject: Optional[str] = Field(None, description="Notification subject")
    message: str = Field(..., description="Notification message")
    template_id: Optional[int] = Field(None, description="Template ID if using template")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class NotificationUpdate(BaseModel):
    """Schema for updating a notification."""
    status: Optional[str] = Field(None, description="Notification status")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: int
    user_id: str
    type: str
    status: str
    channel: str
    recipient: str
    subject: Optional[str]
    message: str
    template_id: Optional[int]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    read_at: Optional[datetime]
    error_message: Optional[str]
    retry_count: int

    class Config:
        from_attributes = True
        populate_by_name = True


class NotificationListResponse(BaseModel):
    """Schema for notification list response."""
    notifications: list[NotificationResponse]
    total: int
    page: int
    page_size: int

