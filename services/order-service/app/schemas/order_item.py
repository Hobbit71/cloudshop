"""OrderItem schemas."""
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class OrderItemCreate(BaseModel):
    """OrderItem creation schema."""
    product_id: UUID
    quantity: int = Field(..., gt=0, le=1000)
    unit_price: Decimal = Field(..., gt=0, decimal_places=2)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "123e4567-e89b-12d3-a456-426614174000",
                "quantity": 2,
                "unit_price": "29.99",
                "discount": "0.00"
            }
        }


class OrderItemResponse(BaseModel):
    """OrderItem response schema."""
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    discount: Decimal
    subtotal: Decimal = Field(default=Decimal("0.00"))
    
    @model_validator(mode='after')
    def compute_subtotal(self) -> 'OrderItemResponse':
        """Compute subtotal after model initialization."""
        self.subtotal = (self.unit_price * self.quantity) - self.discount
        return self
    
    class Config:
        from_attributes = True

