"""Celery tasks."""
from app.tasks.notification_tasks import (
    send_order_confirmation_email,
    send_shipping_notification,
    send_order_reminder,
    send_promotional_emails,
)

__all__ = [
    "send_order_confirmation_email",
    "send_shipping_notification",
    "send_order_reminder",
    "send_promotional_emails",
]

