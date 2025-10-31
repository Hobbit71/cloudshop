"""Tests for OrderService."""
import pytest
from decimal import Decimal
from uuid import uuid4
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, AddressSchema, OrderUpdate
from app.services.order_service import OrderService
from app.services.order_validation_service import OrderValidationService
from app.exceptions import OrderNotFoundError


@pytest.mark.asyncio
async def test_create_order(db_session, customer_id, sample_order_data):
    """Test order creation."""
    service = OrderService(db_session)
    order_data = OrderCreate(**sample_order_data)
    
    order = await service.create_order(customer_id, order_data)
    
    assert order is not None
    assert order.customer_id == customer_id
    assert order.merchant_id == uuid4() if "merchant_id" in sample_order_data else True
    assert order.status == OrderStatus.PENDING
    assert order.total_amount > Decimal("0.00")
    assert len(order.items) == 1
    assert order.items[0].quantity == 2


@pytest.mark.asyncio
async def test_get_order_by_id(db_session, sample_order):
    """Test getting order by ID."""
    service = OrderService(db_session)
    
    order = await service.get_order_by_id(sample_order.id)
    
    assert order.id == sample_order.id
    assert order.status == OrderStatus.PENDING


@pytest.mark.asyncio
async def test_get_order_by_id_not_found(db_session):
    """Test getting non-existent order."""
    service = OrderService(db_session)
    non_existent_id = uuid4()
    
    with pytest.raises(OrderNotFoundError):
        await service.get_order_by_id(non_existent_id)


@pytest.mark.asyncio
async def test_list_orders(db_session, customer_id, sample_order):
    """Test listing orders."""
    service = OrderService(db_session)
    
    orders, total = await service.list_orders(customer_id=sample_order.customer_id)
    
    assert total >= 1
    assert len(orders) >= 1
    assert any(o.id == sample_order.id for o in orders)


@pytest.mark.asyncio
async def test_update_order_status(db_session, sample_order):
    """Test updating order status."""
    service = OrderService(db_session)
    
    order = await service.update_order_status(
        sample_order.id,
        OrderStatus.PROCESSING
    )
    
    assert order.status == OrderStatus.PROCESSING


@pytest.mark.asyncio
async def test_cancel_order(db_session, sample_order):
    """Test cancelling order."""
    service = OrderService(db_session)
    
    order = await service.cancel_order(sample_order.id)
    
    assert order.status == OrderStatus.CANCELLED


@pytest.mark.asyncio
async def test_update_order(db_session, sample_order):
    """Test updating order."""
    service = OrderService(db_session)
    update_data = OrderUpdate(notes="Updated notes")
    
    order = await service.update_order(sample_order.id, update_data)
    
    assert order.notes == "Updated notes"


@pytest.mark.asyncio
async def test_order_validation_empty_items(db_session, customer_id):
    """Test order validation with empty items."""
    order_data = OrderCreate(
        merchant_id=uuid4(),
        items=[],
        shipping_address=AddressSchema(
            street="123 Main St",
            city="New York",
            state="NY",
            zip_code="10001"
        )
    )
    
    with pytest.raises(Exception):  # OrderValidationError
        await OrderValidationService.validate_order_create(order_data)

