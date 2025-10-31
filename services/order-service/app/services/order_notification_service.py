"""Order notification service."""
import logging
from decimal import Decimal
from uuid import UUID
from app.config import settings
from app.models.order import Order

logger = logging.getLogger(__name__)


class OrderNotificationService:
    """Service for sending order notifications."""
    
    @staticmethod
    async def send_order_created_notification(order: Order) -> None:
        """
        Send order created notification.
        
        Args:
            order: Order object
        """
        if not settings.enable_notifications:
            logger.debug("Notifications disabled, skipping order created notification")
            return
        
        # In production, this would integrate with notification service
        logger.info(f"Order created notification for order {order.id}")
    
    @staticmethod
    async def send_order_status_update_notification(
        order: Order,
        old_status: str,
        new_status: str
    ) -> None:
        """
        Send order status update notification.
        
        Args:
            order: Order object
            old_status: Previous status
            new_status: New status
        """
        if not settings.enable_notifications:
            logger.debug("Notifications disabled, skipping status update notification")
            return
        
        # In production, this would integrate with notification service
        logger.info(
            f"Order status update notification for order {order.id}: "
            f"{old_status} -> {new_status}"
        )
    
    @staticmethod
    async def send_order_cancelled_notification(order: Order) -> None:
        """
        Send order cancelled notification.
        
        Args:
            order: Order object
        """
        if not settings.enable_notifications:
            logger.debug("Notifications disabled, skipping cancellation notification")
            return
        
        # In production, this would integrate with notification service
        logger.info(f"Order cancelled notification for order {order.id}")
    
    @staticmethod
    async def send_refund_notification(order: Order, refund_amount: Decimal) -> None:
        """
        Send refund notification.
        
        Args:
            order: Order object
            refund_amount: Refund amount
        """
        if not settings.enable_notifications:
            logger.debug("Notifications disabled, skipping refund notification")
            return
        
        # In production, this would integrate with notification service
        logger.info(
            f"Refund notification for order {order.id}: "
            f"Amount: {refund_amount}"
        )

