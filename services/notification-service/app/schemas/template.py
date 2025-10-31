"""Template schemas."""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class TemplateCreate(BaseModel):
    """Schema for creating a notification template."""
    name: str = Field(..., description="Template name (unique identifier)")
    channel: str = Field(..., description="Channel (email, sms, push, in_app)")
    subject_template: Optional[str] = Field(None, description="Subject template for email")
    body_template: str = Field(..., description="Body template")
    variables: Optional[List[str]] = Field(None, description="Expected template variables")
    description: Optional[str] = Field(None, description="Template description")
    is_active: bool = Field(True, description="Whether template is active")


class TemplateUpdate(BaseModel):
    """Schema for updating a notification template."""
    subject_template: Optional[str] = None
    body_template: Optional[str] = None
    variables: Optional[List[str]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TemplateResponse(BaseModel):
    """Schema for template response."""
    id: int
    name: str
    channel: str
    subject_template: Optional[str]
    body_template: str
    variables: Optional[List[str]]
    is_active: bool
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

