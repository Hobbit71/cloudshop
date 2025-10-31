"""In-app notification service."""
import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.models.notification import Notification, NotificationStatus, NotificationType
from app.database import get_db

logger = logging.getLogger(__name__)


class InAppService:
    """Service for managing in-app notifications."""
    
    async def create_notification(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        template_id: Optional[int] = None
    ) -> Notification:
        """
        Create an in-app notification.
        
        Args:
            db: Database session
            user_id: User ID
            title: Notification title
            message: Notification message
            metadata: Additional metadata
            template_id: Optional template ID
            
        Returns:
            Created notification
        """
        notification = Notification(
            user_id=user_id,
            type=NotificationType.IN_APP.value,
            status=NotificationStatus.SENT.value,  # In-app notifications are immediately available
            channel="in_app",
            recipient=user_id,  # For in-app, recipient is the user_id
            subject=title,
            message=message,
            template_id=template_id,
            metadata=metadata,
            sent_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        
        logger.info(f"In-app notification created for user {user_id}")
        
        return notification
    
    async def get_user_notifications(
        self,
        db: AsyncSession,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> list[Notification]:
        """
        Get in-app notifications for a user.
        
        Args:
            db: Database session
            user_id: User ID
            unread_only: Whether to return only unread notifications
            limit: Maximum number of notifications to return
            offset: Offset for pagination
            
        Returns:
            List of notifications
        """
        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.channel == "in_app"
        )
        
        if unread_only:
            query = query.where(Notification.read_at.is_(None))
        
        query = query.order_by(Notification.created_at.desc())
        query = query.limit(limit).offset(offset)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def mark_as_read(
        self,
        db: AsyncSession,
        notification_id: int,
        user_id: str
    ) -> Optional[Notification]:
        """
        Mark a notification as read.
        
        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for validation)
            
        Returns:
            Updated notification or None if not found
        """
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
            Notification.channel == "in_app"
        )
        
        result = await db.execute(query)
        notification = result.scalar_one_or_none()
        
        if notification and not notification.read_at:
            notification.read_at = datetime.utcnow()
            notification.status = NotificationStatus.READ.value
            await db.commit()
            await db.refresh(notification)
            
            logger.info(f"In-app notification {notification_id} marked as read")
        
        return notification
    
    async def mark_all_as_read(
        self,
        db: AsyncSession,
        user_id: str
    ) -> int:
        """
        Mark all notifications as read for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Number of notifications marked as read
        """
        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.channel == "in_app",
            Notification.read_at.is_(None)
        )
        
        result = await db.execute(query)
        notifications = list(result.scalars().all())
        
        read_count = 0
        for notification in notifications:
            notification.read_at = datetime.utcnow()
            notification.status = NotificationStatus.READ.value
            read_count += 1
        
        await db.commit()
        
        logger.info(f"Marked {read_count} in-app notifications as read for user {user_id}")
        
        return read_count

