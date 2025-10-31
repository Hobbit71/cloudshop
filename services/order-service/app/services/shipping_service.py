"""Shipping service."""
import logging
from decimal import Decimal
from app.config import settings

logger = logging.getLogger(__name__)


class ShippingService:
    """Service for calculating shipping costs."""
    
    @staticmethod
    def calculate_shipping(subtotal: Decimal) -> Decimal:
        """
        Calculate shipping cost based on order subtotal.
        
        Args:
            subtotal: Order subtotal
            
        Returns:
            Decimal: Shipping cost
        """
        if not settings.enable_shipping_calculation:
            return Decimal("0.00")
        
        # Free shipping for orders above threshold
        if subtotal >= Decimal(str(settings.shipping_free_threshold)):
            return Decimal("0.00")
        
        # Base shipping rate
        return Decimal(str(settings.shipping_base_rate))
    
    @staticmethod
    def get_estimated_delivery_days() -> int:
        """
        Get estimated delivery days.
        
        Returns:
            int: Estimated delivery days
        """
        # Default to 5-7 business days
        return 5
    
    @staticmethod
    def get_tracking_info(order_id: str) -> dict:
        """
        Get tracking information for an order.
        
        Args:
            order_id: Order ID
            
        Returns:
            dict: Tracking information
        """
        # In production, this would integrate with shipping providers
        return {
            "order_id": order_id,
            "carrier": "Standard Shipping",
            "tracking_number": f"TRACK-{order_id[:8].upper()}",
            "estimated_delivery": ShippingService.get_estimated_delivery_days(),
            "status": "In Transit"
        }

