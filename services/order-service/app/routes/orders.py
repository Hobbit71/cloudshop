"""Order routes."""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_current_user_id, get_db_session
from app.models.order import OrderStatus
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    OrderUpdate,
    OrderListResponse,
)
from app.services.order_service import OrderService
from app.services.refund_service import RefundService
from app.services.shipping_service import ShippingService
from app.exceptions import OrderNotFoundError

router = APIRouter()


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    customer_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> OrderResponse:
    """
    Create a new order.
    
    Args:
        order_data: Order creation data
        customer_id: Current user ID
        db: Database session
        
    Returns:
        OrderResponse: Created order
    """
    order_service = OrderService(db)
    order = await order_service.create_order(customer_id, order_data)
    return OrderResponse.model_validate(order)


@router.get("/orders", response_model=OrderListResponse)
async def list_orders(
    customer_id: Optional[UUID] = Depends(get_current_user_id),
    merchant_id: Optional[UUID] = Query(None, description="Filter by merchant ID"),
    status: Optional[OrderStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session)
) -> OrderListResponse:
    """
    List orders with pagination.
    
    Args:
        customer_id: Current user ID (optional for admin endpoints)
        merchant_id: Filter by merchant ID
        status: Filter by status
        page: Page number
        page_size: Items per page
        db: Database session
        
    Returns:
        OrderListResponse: List of orders
    """
    order_service = OrderService(db)
    orders, total = await order_service.list_orders(
        customer_id=customer_id,
        merchant_id=merchant_id,
        status=status,
        page=page,
        page_size=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return OrderListResponse(
        orders=[OrderResponse.model_validate(order) for order in orders],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    customer_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> OrderResponse:
    """
    Get order by ID.
    
    Args:
        order_id: Order ID
        customer_id: Current user ID
        db: Database session
        
    Returns:
        OrderResponse: Order details
        
    Raises:
        HTTPException: If order not found
    """
    try:
        order_service = OrderService(db)
        order = await order_service.get_order_by_id(order_id, customer_id)
        return OrderResponse.model_validate(order)
    except OrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail)
        )


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    customer_id: Optional[UUID] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> OrderResponse:
    """
    Update order status.
    
    Args:
        order_id: Order ID
        status_update: Status update data
        customer_id: Current user ID (optional for admin)
        db: Database session
        
    Returns:
        OrderResponse: Updated order
        
    Raises:
        HTTPException: If order not found or status transition invalid
    """
    try:
        order_service = OrderService(db)
        order = await order_service.update_order_status(
            order_id,
            status_update.status,
            customer_id
        )
        return OrderResponse.model_validate(order)
    except OrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    customer_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> OrderResponse:
    """
    Cancel an order.
    
    Args:
        order_id: Order ID
        customer_id: Current user ID
        db: Database session
        
    Returns:
        OrderResponse: Cancelled order
        
    Raises:
        HTTPException: If order not found or cannot be cancelled
    """
    try:
        order_service = OrderService(db)
        order = await order_service.cancel_order(order_id, customer_id)
        return OrderResponse.model_validate(order)
    except OrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}/tracking")
async def get_order_tracking(
    order_id: UUID,
    customer_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """
    Get order tracking information.
    
    Args:
        order_id: Order ID
        customer_id: Current user ID
        db: Database session
        
    Returns:
        dict: Tracking information
        
    Raises:
        HTTPException: If order not found
    """
    try:
        order_service = OrderService(db)
        order = await order_service.get_order_by_id(order_id, customer_id)
        
        tracking_info = ShippingService.get_tracking_info(str(order.id))
        tracking_info["order_status"] = order.status.value
        
        return tracking_info
    except OrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail)
        )


@router.post("/orders/{order_id}/refund")
async def request_refund(
    order_id: UUID,
    reason: str = Query("", description="Refund reason"),
    customer_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """
    Request refund for an order.
    
    Args:
        order_id: Order ID
        reason: Refund reason
        customer_id: Current user ID
        db: Database session
        
    Returns:
        dict: Refund information
        
    Raises:
        HTTPException: If order not found or refund cannot be processed
    """
    try:
        order_service = OrderService(db)
        order = await order_service.get_order_by_id(order_id, customer_id)
        
        refund_service = RefundService()
        refund_info = await refund_service.process_refund(order, reason=reason)
        
        # Update order status to REFUNDED
        await order_service.update_order_status(
            order_id,
            OrderStatus.REFUNDED,
            customer_id
        )
        
        return refund_info
    except OrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/merchant/{merchant_id}", response_model=OrderListResponse)
async def get_merchant_orders(
    merchant_id: UUID,
    status: Optional[OrderStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session)
) -> OrderListResponse:
    """
    Get orders for a merchant.
    
    Args:
        merchant_id: Merchant ID
        status: Filter by status
        page: Page number
        page_size: Items per page
        db: Database session
        
    Returns:
        OrderListResponse: List of orders
    """
    order_service = OrderService(db)
    orders, total = await order_service.list_orders(
        merchant_id=merchant_id,
        status=status,
        page=page,
        page_size=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return OrderListResponse(
        orders=[OrderResponse.model_validate(order) for order in orders],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_update: OrderUpdate,
    customer_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> OrderResponse:
    """
    Update order.
    
    Args:
        order_id: Order ID
        order_update: Order update data
        customer_id: Current user ID
        db: Database session
        
    Returns:
        OrderResponse: Updated order
        
    Raises:
        HTTPException: If order not found
    """
    try:
        order_service = OrderService(db)
        order = await order_service.update_order(order_id, order_update, customer_id)
        return OrderResponse.model_validate(order)
    except OrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail)
        )

