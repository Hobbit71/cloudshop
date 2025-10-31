"""Order validation service."""
import logging
from decimal import Decimal
from uuid import UUID
from typing import Optional
from app.schemas.order import OrderCreate
from app.exceptions import OrderValidationError

logger = logging.getLogger(__name__)


class OrderValidationService:
    """Service for validating order business rules."""
    
    @staticmethod
    async def validate_order_create(order_data: OrderCreate) -> None:
        """
        Validate order creation data.
        
        Args:
            order_data: Order creation data
            
        Raises:
            OrderValidationError: If validation fails
        """
        # Validate items
        if not order_data.items or len(order_data.items) == 0:
            raise OrderValidationError("Order must have at least one item")
        
        # Validate each item
        for item in order_data.items:
            if item.quantity <= 0:
                raise OrderValidationError(
                    f"Item quantity must be greater than 0 for product {item.product_id}"
                )
            if item.unit_price <= 0:
                raise OrderValidationError(
                    f"Item unit price must be greater than 0 for product {item.product_id}"
                )
            if item.discount < 0:
                raise OrderValidationError(
                    f"Item discount cannot be negative for product {item.product_id}"
                )
            if item.discount >= item.unit_price * item.quantity:
                raise OrderValidationError(
                    f"Item discount cannot exceed subtotal for product {item.product_id}"
                )
        
        # Validate shipping address
        if not order_data.shipping_address:
            raise OrderValidationError("Shipping address is required")
        
        # Validate address fields
        address = order_data.shipping_address
        if not address.street or not address.city or not address.state or not address.zip_code:
            raise OrderValidationError("Shipping address must have street, city, state, and zip code")
    
    @staticmethod
    def validate_status_transition(
        current_status: str,
        new_status: str
    ) -> bool:
        """
        Validate order status transition.
        
        Args:
            current_status: Current order status
            new_status: New order status
            
        Returns:
            bool: True if transition is valid
            
        Raises:
            OrderValidationError: If transition is invalid
        """
        valid_transitions = {
            "PENDING": ["PROCESSING", "CANCELLED"],
            "PROCESSING": ["SHIPPED", "CANCELLED"],
            "SHIPPED": ["DELIVERED"],
            "DELIVERED": ["REFUNDED"],
            "CANCELLED": [],
            "REFUNDED": [],
        }
        
        allowed = valid_transitions.get(current_status, [])
        if new_status not in allowed:
            raise OrderValidationError(
                f"Cannot transition order from {current_status} to {new_status}"
            )
        
        return True
    
    @staticmethod
    def validate_cancellation(current_status: str) -> bool:
        """
        Validate if order can be cancelled.
        
        Args:
            current_status: Current order status
            
        Returns:
            bool: True if order can be cancelled
            
        Raises:
            OrderValidationError: If order cannot be cancelled
        """
        cancellable_statuses = ["PENDING", "PROCESSING"]
        
        if current_status not in cancellable_statuses:
            raise OrderValidationError(
                f"Order with status {current_status} cannot be cancelled"
            )
        
        return True
    
    @staticmethod
    def validate_refund(current_status: str) -> bool:
        """
        Validate if order can be refunded.
        
        Args:
            current_status: Current order status
            
        Returns:
            bool: True if order can be refunded
            
        Raises:
            OrderValidationError: If order cannot be refunded
        """
        refundable_statuses = ["DELIVERED"]
        
        if current_status not in refundable_statuses:
            raise OrderValidationError(
                f"Order with status {current_status} cannot be refunded"
            )
        
        return True

