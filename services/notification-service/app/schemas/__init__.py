"""Pydantic schemas."""
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationUpdate,
    NotificationListResponse
)
from app.schemas.template import (
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate
)

__all__ = [
    "NotificationCreate",
    "NotificationResponse",
    "NotificationUpdate",
    "NotificationListResponse",
    "TemplateCreate",
    "TemplateResponse",
    "TemplateUpdate",
]

