"""Pytest configuration and fixtures."""
import pytest
import asyncio
from typing import AsyncGenerator
from uuid import uuid4
from decimal import Decimal
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy import String
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database import Base, get_db
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.main import app


# Custom UUID type that works with both PostgreSQL and SQLite
class GUID(TypeDecorator):
    """Platform-independent GUID type."""
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PGUUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, str):
                return str(value)
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            from uuid import UUID
            return UUID(value)


# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    # Patch UUID and JSONB columns for SQLite compatibility
    from sqlalchemy import String, JSON
    from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
    
    # Replace PGUUID with String and JSONB with JSON in all tables for SQLite compatibility
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, PGUUID):
                column.type = String(36)
            elif isinstance(column.type, JSONB):
                column.type = JSON()
    
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
    )
    
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_maker() as session:
        yield session
    
    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()
    
    # Restore original UUID types
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, String) and column.type.length == 36:
                # Note: We can't easily restore the original type, but this is fine for tests
                pass


@pytest.fixture
async def db_session(test_db: AsyncSession) -> AsyncSession:
    """Get database session for testing."""
    return test_db


@pytest.fixture
def override_get_db(db_session: AsyncSession):
    """Override get_db dependency."""
    async def _get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def sample_order_data():
    """Sample order creation data."""
    return {
        "merchant_id": str(uuid4()),
        "items": [
            {
                "product_id": str(uuid4()),
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
        "notes": "Test order"
    }


@pytest.fixture
async def sample_order(db_session: AsyncSession) -> Order:
    """Create a sample order for testing."""
    order = Order(
        id=uuid4(),
        merchant_id=uuid4(),
        customer_id=uuid4(),
        status=OrderStatus.PENDING,
        total_amount=Decimal("64.78"),
        tax_amount=Decimal("4.80"),
        shipping_address={
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "country": "US"
        }
    )
    
    db_session.add(order)
    await db_session.flush()
    
    item = OrderItem(
        order_id=order.id,
        product_id=uuid4(),
        quantity=2,
        unit_price=Decimal("29.99"),
        discount=Decimal("0.00")
    )
    
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(order, ["items"])
    
    return order


@pytest.fixture
def customer_id():
    """Sample customer ID."""
    return uuid4()

