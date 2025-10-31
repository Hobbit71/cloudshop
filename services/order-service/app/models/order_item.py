"""OrderItem model."""
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Numeric,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class OrderItem(Base):
    """OrderItem model."""
    __tablename__ = "order_items"
    
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    
    order_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    product_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=False,
        index=True
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    
    discount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00")
    )
    
    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items"
    )
    
    @property
    def subtotal(self) -> Decimal:
        """Calculate item subtotal."""
        return (self.unit_price * self.quantity) - self.discount
    
    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, product_id={self.product_id}, quantity={self.quantity})>"

