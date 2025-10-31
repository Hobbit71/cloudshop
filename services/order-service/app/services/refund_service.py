"""Refund service."""
import logging
from decimal import Decimal
from typing import Optional
from uuid import UUID
from app.models.order import Order
from app.exceptions import OrderValidationError

logger = logging.getLogger(__name__)


class RefundService:
    """Service for processing refunds."""
    
    @staticmethod
    async def process_refund(
        order: Order,
        refund_amount: Optional[Decimal] = None,
        reason: str = ""
    ) -> dict:
        """
        Process refund for an order.
        
        Args:
            order: Order object
            refund_amount: Refund amount (if None, refund full amount)
            reason: Refund reason
            
        Returns:
            dict: Refund information
            
        Raises:
            OrderValidationError: If refund cannot be processed
        """
        # Validate refund eligibility
        from app.services.order_validation_service import OrderValidationService
        OrderValidationService.validate_refund(order.status.value)
        
        # Determine refund amount
        if refund_amount is None:
            refund_amount = order.total_amount
        
        if refund_amount > order.total_amount:
            raise OrderValidationError(
                f"Refund amount ({refund_amount}) cannot exceed order total ({order.total_amount})"
            )
        
        # In production, this would integrate with payment service
        logger.info(
            f"Processing refund for order {order.id}: "
            f"Amount: {refund_amount}, Reason: {reason}"
        )
        
        # Return refund information
        return {
            "order_id": str(order.id),
            "refund_amount": str(refund_amount),
            "reason": reason,
            "status": "processed",
            "refund_id": f"REF-{order.id}"
        }
    
    @staticmethod
    async def calculate_refund_amount(order: Order) -> Decimal:
        """
        Calculate refund amount for an order.
        
        Args:
            order: Order object
            
        Returns:
            Decimal: Refund amount
        """
        # Full refund for now, but could be partial based on business rules
        return order.total_amount

