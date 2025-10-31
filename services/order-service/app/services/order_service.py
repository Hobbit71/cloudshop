"""Order service."""
import logging
from decimal import Decimal
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate, OrderUpdate
from app.exceptions import OrderNotFoundError, InvalidOrderStatusError
from app.services.order_validation_service import OrderValidationService
from app.services.order_notification_service import OrderNotificationService
from app.services.shipping_service import ShippingService
from app.config import settings

logger = logging.getLogger(__name__)


class OrderService:
    """Service for order operations."""
    
    def __init__(self, db: AsyncSession):
        """
        Initialize OrderService.
        
        Args:
            db: Database session
        """
        self.db = db
    
    async def create_order(
        self,
        customer_id: UUID,
        order_data: OrderCreate
    ) -> Order:
        """
        Create a new order.
        
        Args:
            customer_id: Customer ID
            order_data: Order creation data
            
        Returns:
            Order: Created order
        """
        # Validate order data
        await OrderValidationService.validate_order_create(order_data)
        
        # Calculate subtotal
        subtotal = Decimal("0.00")
        for item_data in order_data.items:
            item_subtotal = (item_data.unit_price * item_data.quantity) - item_data.discount
            subtotal += item_subtotal
        
        # Calculate shipping
        shipping_cost = ShippingService.calculate_shipping(subtotal)
        
        # Calculate tax
        tax_amount = subtotal * Decimal(str(settings.tax_rate))
        
        # Calculate total
        total_amount = subtotal + shipping_cost + tax_amount
        
        # Create order
        order = Order(
            merchant_id=order_data.merchant_id,
            customer_id=customer_id,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            tax_amount=tax_amount,
            shipping_address=order_data.shipping_address.model_dump(),
            notes=order_data.notes
        )
        
        self.db.add(order)
        await self.db.flush()
        
        # Create order items
        for item_data in order_data.items:
            item = OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                discount=item_data.discount
            )
            self.db.add(item)
        
        await self.db.commit()
        await self.db.refresh(order)
        
        # Load items relationship
        await self.db.refresh(order, ["items"])
        
        # Send notification
        await OrderNotificationService.send_order_created_notification(order)
        
        logger.info(f"Created order {order.id} for customer {customer_id}")
        return order
    
    async def get_order_by_id(
        self,
        order_id: UUID,
        customer_id: Optional[UUID] = None
    ) -> Order:
        """
        Get order by ID.
        
        Args:
            order_id: Order ID
            customer_id: Optional customer ID for authorization
            
        Returns:
            Order: Order object
            
        Raises:
            OrderNotFoundError: If order not found
        """
        query = select(Order).options(
            selectinload(Order.items)
        ).where(Order.id == order_id)
        
        if customer_id:
            query = query.where(Order.customer_id == customer_id)
        
        result = await self.db.execute(query)
        order = result.scalar_one_or_none()
        
        if not order:
            raise OrderNotFoundError(str(order_id))
        
        return order
    
    async def list_orders(
        self,
        customer_id: Optional[UUID] = None,
        merchant_id: Optional[UUID] = None,
        status: Optional[OrderStatus] = None,
        page: int = 1,
        page_size: int = 10
    ) -> tuple[list[Order], int]:
        """
        List orders with pagination.
        
        Args:
            customer_id: Filter by customer ID
            merchant_id: Filter by merchant ID
            status: Filter by status
            page: Page number
            page_size: Items per page
            
        Returns:
            tuple: (orders, total_count)
        """
        # Build query
        query = select(Order).options(selectinload(Order.items))
        count_query = select(func.count(Order.id))
        
        conditions = []
        if customer_id:
            conditions.append(Order.customer_id == customer_id)
        if merchant_id:
            conditions.append(Order.merchant_id == merchant_id)
        if status:
            conditions.append(Order.status == status)
        
        if conditions:
            where_clause = and_(*conditions)
            query = query.where(where_clause)
            count_query = count_query.where(where_clause)
        
        # Get total count
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size)
        
        # Execute query
        result = await self.db.execute(query)
        orders = result.scalars().all()
        
        return list(orders), total
    
    async def update_order_status(
        self,
        order_id: UUID,
        new_status: OrderStatus,
        customer_id: Optional[UUID] = None
    ) -> Order:
        """
        Update order status.
        
        Args:
            order_id: Order ID
            new_status: New status
            customer_id: Optional customer ID for authorization
            
        Returns:
            Order: Updated order
            
        Raises:
            OrderNotFoundError: If order not found
            InvalidOrderStatusError: If status transition is invalid
        """
        order = await self.get_order_by_id(order_id, customer_id)
        
        # Validate status transition
        OrderValidationService.validate_status_transition(
            order.status.value,
            new_status.value
        )
        
        old_status = order.status
        order.status = new_status
        
        await self.db.commit()
        await self.db.refresh(order, ["items"])
        
        # Send notification
        await OrderNotificationService.send_order_status_update_notification(
            order,
            old_status.value,
            new_status.value
        )
        
        logger.info(f"Updated order {order_id} status to {new_status.value}")
        return order
    
    async def cancel_order(
        self,
        order_id: UUID,
        customer_id: Optional[UUID] = None
    ) -> Order:
        """
        Cancel an order.
        
        Args:
            order_id: Order ID
            customer_id: Optional customer ID for authorization
            
        Returns:
            Order: Cancelled order
            
        Raises:
            OrderNotFoundError: If order not found
            OrderValidationError: If order cannot be cancelled
        """
        order = await self.get_order_by_id(order_id, customer_id)
        
        # Validate cancellation
        OrderValidationService.validate_cancellation(order.status.value)
        
        old_status = order.status
        order.status = OrderStatus.CANCELLED
        
        await self.db.commit()
        await self.db.refresh(order, ["items"])
        
        # Send notification
        await OrderNotificationService.send_order_cancelled_notification(order)
        
        logger.info(f"Cancelled order {order_id}")
        return order
    
    async def update_order(
        self,
        order_id: UUID,
        order_update: OrderUpdate,
        customer_id: Optional[UUID] = None
    ) -> Order:
        """
        Update order.
        
        Args:
            order_id: Order ID
            order_update: Order update data
            customer_id: Optional customer ID for authorization
            
        Returns:
            Order: Updated order
        """
        order = await self.get_order_by_id(order_id, customer_id)
        
        if order_update.notes is not None:
            order.notes = order_update.notes
        
        await self.db.commit()
        await self.db.refresh(order, ["items"])
        
        logger.info(f"Updated order {order_id}")
        return order

