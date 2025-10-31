"""Notification routes."""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from app.database import get_db
from app.models.notification import Notification, NotificationStatus, NotificationType
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse
)
from app.services.email_service import EmailService
from app.services.sms_service import SMSService
from app.services.push_service import PushService
from app.services.in_app_service import InAppService
from app.services.template_service import TemplateService
from app.tasks.notification_tasks import (
    send_order_confirmation_email,
    send_shipping_notification,
    send_order_reminder,
    send_promotional_emails
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_data: NotificationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create and send a notification."""
    # Determine notification type
    notification_type = NotificationType.EMAIL.value
    if notification_data.channel == "sms":
        notification_type = NotificationType.SMS.value
    elif notification_data.channel == "push":
        notification_type = NotificationType.PUSH.value
    elif notification_data.channel == "in_app":
        notification_type = NotificationType.IN_APP.value
    
    # Create notification record
    notification = Notification(
        user_id=notification_data.user_id,
        type=notification_type,
        status=NotificationStatus.PENDING.value,
        channel=notification_data.channel,
        recipient=notification_data.recipient,
        subject=notification_data.subject,
        message=notification_data.message,
        template_id=notification_data.template_id,
        metadata=notification_data.metadata,
        created_at=datetime.utcnow()
    )
    
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    # Send notification based on channel
    try:
        if notification_data.channel == "email":
            email_service = EmailService()
            result = await email_service.send(
                to_email=notification_data.recipient,
                subject=notification_data.subject or "Notification",
                html_content=notification_data.message,
                metadata=notification_data.metadata
            )
            
            if result.get("success"):
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = result.get("error")
        
        elif notification_data.channel == "sms":
            sms_service = SMSService()
            result = await sms_service.send(
                to_phone=notification_data.recipient,
                message=notification_data.message,
                metadata=notification_data.metadata
            )
            
            if result.get("success"):
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = result.get("error")
        
        elif notification_data.channel == "push":
            push_service = PushService()
            result = await push_service.send(
                device_token=notification_data.recipient,
                title=notification_data.subject or "Notification",
                body=notification_data.message,
                metadata=notification_data.metadata
            )
            
            if result.get("success"):
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = result.get("error")
        
        elif notification_data.channel == "in_app":
            in_app_service = InAppService()
            notification = await in_app_service.create_notification(
                db,
                notification_data.user_id,
                notification_data.subject or "Notification",
                notification_data.message,
                notification_data.metadata,
                notification_data.template_id
            )
            return NotificationResponse.model_validate(notification)
        
        await db.commit()
        await db.refresh(notification)
        
    except Exception as e:
        notification.status = NotificationStatus.FAILED.value
        notification.error_message = str(e)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send notification: {str(e)}"
        )
    
        return NotificationResponse.model_validate(notification)


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    channel: Optional[str] = Query(None, description="Filter by channel"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List notifications with optional filters."""
    query = select(Notification)
    count_query = select(func.count(Notification.id))
    
    if user_id:
        query = query.where(Notification.user_id == user_id)
        count_query = count_query.where(Notification.user_id == user_id)
    
    if channel:
        query = query.where(Notification.channel == channel)
        count_query = count_query.where(Notification.channel == channel)
    
    if status_filter:
        query = query.where(Notification.status == status_filter)
        count_query = count_query.where(Notification.status == status_filter)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.order_by(Notification.created_at.desc())
    query = query.limit(page_size).offset((page - 1) * page_size)
    
    result = await db.execute(query)
    notifications = list(result.scalars().all())
    
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific notification."""
    query = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notification_id} not found"
        )
    
        return NotificationResponse.model_validate(notification)


@router.post("/tasks/order-confirmation", status_code=status.HTTP_202_ACCEPTED)
async def trigger_order_confirmation(
    user_id: str,
    user_email: str,
    order_id: str,
    order_data: dict
):
    """Trigger order confirmation email task."""
    task = send_order_confirmation_email.delay(
        user_id=user_id,
        user_email=user_email,
        order_id=order_id,
        order_data=order_data
    )
    return {"task_id": task.id, "status": "accepted"}


@router.post("/tasks/shipping-notification", status_code=status.HTTP_202_ACCEPTED)
async def trigger_shipping_notification(
    user_id: str,
    user_email: str,
    order_id: str,
    tracking_number: str,
    carrier: str,
    shipping_data: dict
):
    """Trigger shipping notification task."""
    task = send_shipping_notification.delay(
        user_id=user_id,
        user_email=user_email,
        order_id=order_id,
        tracking_number=tracking_number,
        carrier=carrier,
        shipping_data=shipping_data
    )
    return {"task_id": task.id, "status": "accepted"}


@router.post("/tasks/order-reminder", status_code=status.HTTP_202_ACCEPTED)
async def trigger_order_reminder(
    user_id: str,
    user_email: str,
    order_id: str,
    reminder_type: str = "cart_abandonment",
    reminder_data: Optional[dict] = None
):
    """Trigger order reminder task."""
    task = send_order_reminder.delay(
        user_id=user_id,
        user_email=user_email,
        order_id=order_id,
        reminder_type=reminder_type,
        reminder_data=reminder_data or {}
    )
    return {"task_id": task.id, "status": "accepted"}


@router.post("/tasks/promotional-emails", status_code=status.HTTP_202_ACCEPTED)
async def trigger_promotional_emails(
    user_ids: List[str],
    template_name: str,
    promotion_data: dict
):
    """Trigger promotional emails task."""
    task = send_promotional_emails.delay(
        user_ids=user_ids,
        template_name=template_name,
        promotion_data=promotion_data
    )
    return {"task_id": task.id, "status": "accepted"}

