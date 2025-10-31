"""Order schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field
from app.models.order import OrderStatus
from app.schemas.order_item import OrderItemCreate, OrderItemResponse
from app.schemas.address import AddressSchema


class OrderCreate(BaseModel):
    """Order creation schema."""
    merchant_id: UUID
    items: list[OrderItemCreate] = Field(..., min_length=1, description="Order must have at least one item")
    shipping_address: AddressSchema
    notes: Optional[str] = Field(None, max_length=1000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "merchant_id": "123e4567-e89b-12d3-a456-426614174000",
                "items": [
                    {
                        "product_id": "223e4567-e89b-12d3-a456-426614174000",
                        "quantity": 2,
                        "unit_price": "29.99",
                        "discount": "0.00"
                    }
                ],
                "shipping_address": {
                    "street": "123 Main St",
                    "city": "New York",
                    "state": "NY",
                    "zip_code": "10001",
                    "country": "US"
                },
                "notes": "Please handle with care"
            }
        }


class OrderUpdate(BaseModel):
    """Order update schema."""
    notes: Optional[str] = Field(None, max_length=1000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "notes": "Updated notes"
            }
        }


class OrderStatusUpdate(BaseModel):
    """Order status update schema."""
    status: OrderStatus
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "PROCESSING"
            }
        }


class OrderResponse(BaseModel):
    """Order response schema."""
    id: UUID
    merchant_id: UUID
    customer_id: UUID
    status: OrderStatus
    items: list[OrderItemResponse]
    total_amount: Decimal
    tax_amount: Decimal
    shipping_address: dict
    payment_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    notes: Optional[str]
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "323e4567-e89b-12d3-a456-426614174000",
                "merchant_id": "123e4567-e89b-12d3-a456-426614174000",
                "customer_id": "423e4567-e89b-12d3-a456-426614174000",
                "status": "PENDING",
                "items": [],
                "total_amount": "59.98",
                "tax_amount": "4.80",
                "shipping_address": {
                    "street": "123 Main St",
                    "city": "New York",
                    "state": "NY",
                    "zip_code": "10001",
                    "country": "US"
                },
                "payment_id": None,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "notes": "Please handle with care"
            }
        }


class OrderListResponse(BaseModel):
    """Order list response schema."""
    orders: list[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "orders": [],
                "total": 10,
                "page": 1,
                "page_size": 10,
                "total_pages": 1
            }
        }

