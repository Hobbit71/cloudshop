"""Tests for OrderValidationService."""
import pytest
from uuid import uuid4
from app.schemas.order import OrderCreate, AddressSchema
from app.services.order_validation_service import OrderValidationService
from app.exceptions import OrderValidationError


@pytest.mark.asyncio
async def test_validate_order_create_success():
    """Test successful order validation."""
    order_data = OrderCreate(
        merchant_id=uuid4(),
        items=[
            {
                "product_id": uuid4(),
                "quantity": 2,
                "unit_price": "29.99",
                "discount": "0.00"
            }
        ],
        shipping_address=AddressSchema(
            street="123 Main St",
            city="New York",
            state="NY",
            zip_code="10001"
        )
    )
    
    # Should not raise
    await OrderValidationService.validate_order_create(order_data)


@pytest.mark.asyncio
async def test_validate_order_create_empty_items():
    """Test validation with empty items."""
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
    
    with pytest.raises(OrderValidationError):
        await OrderValidationService.validate_order_create(order_data)


@pytest.mark.asyncio
async def test_validate_status_transition_success():
    """Test valid status transition."""
    # Should not raise
    OrderValidationService.validate_status_transition("PENDING", "PROCESSING")


@pytest.mark.asyncio
async def test_validate_status_transition_invalid():
    """Test invalid status transition."""
    with pytest.raises(OrderValidationError):
        OrderValidationService.validate_status_transition("PENDING", "DELIVERED")


@pytest.mark.asyncio
async def test_validate_cancellation_success():
    """Test valid cancellation."""
    # Should not raise
    OrderValidationService.validate_cancellation("PENDING")


@pytest.mark.asyncio
async def test_validate_cancellation_invalid():
    """Test invalid cancellation."""
    with pytest.raises(OrderValidationError):
        OrderValidationService.validate_cancellation("DELIVERED")


@pytest.mark.asyncio
async def test_validate_refund_success():
    """Test valid refund."""
    # Should not raise
    OrderValidationService.validate_refund("DELIVERED")


@pytest.mark.asyncio
async def test_validate_refund_invalid():
    """Test invalid refund."""
    with pytest.raises(OrderValidationError):
        OrderValidationService.validate_refund("PENDING")

