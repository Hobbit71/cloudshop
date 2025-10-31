"""Celery tasks for notifications."""
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.celery_app import celery_app
from app.config import settings
from app.models.notification import Notification, NotificationStatus, NotificationType
from app.models.delivery_tracking import DeliveryTracking
from app.services.email_service import EmailService
from app.services.sms_service import SMSService
from app.services.push_service import PushService
from app.services.template_service import TemplateService

logger = logging.getLogger(__name__)

# Create database engine for tasks (sync access via async)
engine = create_async_engine(settings.database_url)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@celery_app.task(name="send_order_confirmation_email", bind=True, max_retries=3)
def send_order_confirmation_email(
    self,
    user_id: str,
    user_email: str,
    order_id: str,
    order_data: Dict[str, Any],
    template_name: Optional[str] = "order_confirmation"
):
    """
    Send order confirmation email.
    
    Args:
        user_id: User ID
        user_email: User email address
        order_id: Order ID
        order_data: Order details (items, total, etc.)
        template_name: Template name to use
    """
    import asyncio
    
    async def _send():
        db = AsyncSessionLocal()
        try:
            # Get template if provided
            template_service = TemplateService()
            template_data = None
            if template_name:
                template_data = await template_service.render_template(
                    db,
                    template_name,
                    {
                        "user_name": order_data.get("user_name", "Customer"),
                        "order_id": order_id,
                        "order_total": order_data.get("total", "0.00"),
                        "order_date": order_data.get("order_date", datetime.utcnow().strftime("%Y-%m-%d")),
                        "items": ", ".join([item.get("name", "") for item in order_data.get("items", [])]),
                        **order_data
                    }
                )
            
            # Create notification record
            notification = Notification(
                user_id=user_id,
                type=NotificationType.EMAIL.value,
                status=NotificationStatus.PENDING.value,
                channel="email",
                recipient=user_email,
                subject=template_data["subject"] if template_data else f"Order Confirmation #{order_id}",
                message=template_data["body"] if template_data else f"Thank you for your order #{order_id}",
                metadata={"order_id": order_id, "order_data": order_data},
                created_at=datetime.utcnow()
            )
            db.add(notification)
            await db.commit()
            await db.refresh(notification)
            
            # Send email
            email_service = EmailService()
            subject = template_data["subject"] if template_data else f"Order Confirmation #{order_id}"
            body = template_data["body"] if template_data else f"Thank you for your order #{order_id}. Your order details are in your account."
            
            result = await email_service.send(
                to_email=user_email,
                subject=subject,
                html_content=body,
                metadata={"order_id": order_id, "user_id": user_id}
            )
            
            # Update notification status
            if result.get("success"):
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = result.get("error", "Unknown error")
                notification.retry_count = self.request.retries
            
            await db.commit()
            
            # Create delivery tracking
            tracking = DeliveryTracking(
                notification_id=notification.id,
                event_type="sent" if result.get("success") else "failed",
                provider_response=str(result),
                timestamp=datetime.utcnow()
            )
            db.add(tracking)
            await db.commit()
            
            logger.info(f"Order confirmation email sent to {user_email} for order {order_id}")
            return result.get("success", False)
        
        except Exception as e:
            logger.error(f"Error sending order confirmation email: {str(e)}")
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        finally:
            await db.close()
    
    return asyncio.run(_send())


@celery_app.task(name="send_shipping_notification", bind=True, max_retries=3)
def send_shipping_notification(
    self,
    user_id: str,
    user_email: str,
    order_id: str,
    tracking_number: str,
    carrier: str,
    shipping_data: Dict[str, Any],
    template_name: Optional[str] = "shipping_notification"
):
    """
    Send shipping notification.
    
    Args:
        user_id: User ID
        user_email: User email address
        order_id: Order ID
        tracking_number: Shipping tracking number
        carrier: Shipping carrier name
        shipping_data: Additional shipping information
        template_name: Template name to use
    """
    import asyncio
    
    async def _send():
        db = AsyncSessionLocal()
        try:
            template_service = TemplateService()
            template_data = None
            if template_name:
                template_data = await template_service.render_template(
                    db,
                    template_name,
                    {
                        "user_name": shipping_data.get("user_name", "Customer"),
                        "order_id": order_id,
                        "tracking_number": tracking_number,
                        "carrier": carrier,
                        "estimated_delivery": shipping_data.get("estimated_delivery", "TBD"),
                        **shipping_data
                    }
                )
            
            notification = Notification(
                user_id=user_id,
                type=NotificationType.EMAIL.value,
                status=NotificationStatus.PENDING.value,
                channel="email",
                recipient=user_email,
                subject=template_data["subject"] if template_data else f"Your Order #{order_id} Has Shipped",
                message=template_data["body"] if template_data else f"Your order #{order_id} has shipped. Tracking: {tracking_number}",
                metadata={
                    "order_id": order_id,
                    "tracking_number": tracking_number,
                    "carrier": carrier,
                    **shipping_data
                },
                created_at=datetime.utcnow()
            )
            db.add(notification)
            await db.commit()
            await db.refresh(notification)
            
            email_service = EmailService()
            subject = template_data["subject"] if template_data else f"Your Order #{order_id} Has Shipped"
            body = template_data["body"] if template_data else f"Your order #{order_id} has shipped! Track your package: {tracking_number} ({carrier})"
            
            result = await email_service.send(
                to_email=user_email,
                subject=subject,
                html_content=body,
                metadata={"order_id": order_id, "tracking_number": tracking_number}
            )
            
            if result.get("success"):
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = result.get("error", "Unknown error")
                notification.retry_count = self.request.retries
            
            await db.commit()
            
            tracking = DeliveryTracking(
                notification_id=notification.id,
                event_type="sent" if result.get("success") else "failed",
                provider_response=str(result),
                timestamp=datetime.utcnow()
            )
            db.add(tracking)
            await db.commit()
            
            logger.info(f"Shipping notification sent to {user_email} for order {order_id}")
            return result.get("success", False)
        
        except Exception as e:
            logger.error(f"Error sending shipping notification: {str(e)}")
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        finally:
            await db.close()
    
    return asyncio.run(_send())


@celery_app.task(name="send_order_reminder", bind=True, max_retries=3)
def send_order_reminder(
    self,
    user_id: str,
    user_email: str,
    order_id: str,
    reminder_type: str = "cart_abandonment",
    reminder_data: Optional[Dict[str, Any]] = None,
    template_name: Optional[str] = "order_reminder"
):
    """
    Send order reminder (e.g., cart abandonment, order pending payment).
    
    Args:
        user_id: User ID
        user_email: User email address
        order_id: Order ID or cart ID
        reminder_type: Type of reminder (cart_abandonment, pending_payment, etc.)
        reminder_data: Additional reminder information
        template_name: Template name to use
    """
    import asyncio
    
    async def _send():
        db = AsyncSessionLocal()
        try:
            reminder_data = reminder_data or {}
            template_service = TemplateService()
            template_data = None
            if template_name:
                template_data = await template_service.render_template(
                    db,
                    template_name,
                    {
                        "user_name": reminder_data.get("user_name", "Customer"),
                        "order_id": order_id,
                        "reminder_type": reminder_type,
                        **reminder_data
                    }
                )
            
            notification = Notification(
                user_id=user_id,
                type=NotificationType.EMAIL.value,
                status=NotificationStatus.PENDING.value,
                channel="email",
                recipient=user_email,
                subject=template_data["subject"] if template_data else "Complete Your Order",
                message=template_data["body"] if template_data else f"Don't forget to complete your order #{order_id}",
                metadata={
                    "order_id": order_id,
                    "reminder_type": reminder_type,
                    **reminder_data
                },
                created_at=datetime.utcnow()
            )
            db.add(notification)
            await db.commit()
            await db.refresh(notification)
            
            email_service = EmailService()
            subject = template_data["subject"] if template_data else "Complete Your Order"
            body = template_data["body"] if template_data else f"You have items waiting in your cart. Complete your order #{order_id} today!"
            
            result = await email_service.send(
                to_email=user_email,
                subject=subject,
                html_content=body,
                metadata={"order_id": order_id, "reminder_type": reminder_type}
            )
            
            if result.get("success"):
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = result.get("error", "Unknown error")
                notification.retry_count = self.request.retries
            
            await db.commit()
            
            tracking = DeliveryTracking(
                notification_id=notification.id,
                event_type="sent" if result.get("success") else "failed",
                provider_response=str(result),
                timestamp=datetime.utcnow()
            )
            db.add(tracking)
            await db.commit()
            
            logger.info(f"Order reminder sent to {user_email} for {reminder_type}")
            return result.get("success", False)
        
        except Exception as e:
            logger.error(f"Error sending order reminder: {str(e)}")
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        finally:
            await db.close()
    
    return asyncio.run(_send())


@celery_app.task(name="send_promotional_emails", bind=True, max_retries=3)
def send_promotional_emails(
    self,
    user_ids: list[str],
    template_name: str,
    promotion_data: Dict[str, Any],
    batch_size: int = 100
):
    """
    Send promotional emails to multiple users.
    
    Args:
        user_ids: List of user IDs
        template_name: Template name to use
        promotion_data: Promotion details (title, description, discount, etc.)
        batch_size: Number of emails to send per batch
    """
    import asyncio
    
    async def _send():
        db = AsyncSessionLocal()
        try:
            template_service = TemplateService()
            email_service = EmailService()
            
            success_count = 0
            failure_count = 0
            
            for i in range(0, len(user_ids), batch_size):
                batch = user_ids[i:i + batch_size]
                
                for user_id in batch:
                    try:
                        # Get user email (would typically come from auth service or user_data)
                        # For now, assuming user_id might be email or we get it from metadata
                        user_email = promotion_data.get("user_emails", {}).get(user_id, user_id)
                        
                        template_data = await template_service.render_template(
                            db,
                            template_name,
                            {
                                "user_name": promotion_data.get("user_names", {}).get(user_id, "Customer"),
                                **promotion_data
                            }
                        )
                        
                        if not template_data:
                            logger.warning(f"Template '{template_name}' not found for user {user_id}")
                            failure_count += 1
                            continue
                        
                        notification = Notification(
                            user_id=user_id,
                            type=NotificationType.EMAIL.value,
                            status=NotificationStatus.PENDING.value,
                            channel="email",
                            recipient=user_email,
                            subject=template_data["subject"] or "Special Offer from CloudShop",
                            message=template_data["body"],
                            metadata={"promotion": promotion_data},
                            created_at=datetime.utcnow()
                        )
                        db.add(notification)
                        await db.commit()
                        await db.refresh(notification)
                        
                        result = await email_service.send(
                            to_email=user_email,
                            subject=template_data["subject"] or "Special Offer from CloudShop",
                            html_content=template_data["body"],
                            metadata={"user_id": user_id, "promotion": promotion_data}
                        )
                        
                        if result.get("success"):
                            notification.status = NotificationStatus.SENT.value
                            notification.sent_at = datetime.utcnow()
                            success_count += 1
                        else:
                            notification.status = NotificationStatus.FAILED.value
                            notification.error_message = result.get("error", "Unknown error")
                            failure_count += 1
                        
                        await db.commit()
                        
                        tracking = DeliveryTracking(
                            notification_id=notification.id,
                            event_type="sent" if result.get("success") else "failed",
                            provider_response=str(result),
                            timestamp=datetime.utcnow()
                        )
                        db.add(tracking)
                        await db.commit()
                    
                    except Exception as e:
                        logger.error(f"Error sending promotional email to user {user_id}: {str(e)}")
                        failure_count += 1
                
                logger.info(f"Processed batch {i//batch_size + 1}: {success_count} success, {failure_count} failures")
            
            logger.info(f"Promotional emails completed: {success_count} success, {failure_count} failures")
            return {"success_count": success_count, "failure_count": failure_count}
        
        except Exception as e:
            logger.error(f"Error sending promotional emails: {str(e)}")
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        finally:
            await db.close()
    
    return asyncio.run(_send())

