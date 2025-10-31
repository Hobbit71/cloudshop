# Order Service

Order Service for CloudShop built with FastAPI.

## Features

- Order creation with validation
- Order status tracking (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
- Order history with pagination
- Order cancellation
- Refund processing
- Shipping cost calculation
- Tax calculation
- Order notifications
- Merchant order management

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy (async)
- **Migrations**: Alembic
- **Validation**: Pydantic
- **Testing**: Pytest with async support

## Project Structure

```
order-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database setup
│   ├── dependencies.py      # Dependency injection
│   ├── exceptions.py        # Custom exceptions
│   ├── models/              # SQLAlchemy models
│   │   ├── order.py
│   │   ├── order_item.py
│   │   └── address.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── order.py
│   │   ├── order_item.py
│   │   └── address.py
│   ├── routes/               # API routes
│   │   └── orders.py
│   ├── services/             # Business logic
│   │   ├── order_service.py
│   │   ├── order_validation_service.py
│   │   ├── order_notification_service.py
│   │   ├── shipping_service.py
│   │   └── refund_service.py
│   └── middleware/          # Middleware
│       └── logger.py
├── migrations/               # Alembic migrations
│   ├── env.py
│   └── versions/
├── tests/                    # Test suite
│   ├── conftest.py
│   ├── test_order_service.py
│   ├── test_order_routes.py
│   └── test_validation_service.py
├── Dockerfile
├── requirements.txt
├── alembic.ini
└── README.md
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 12+
- Docker (optional)

### Installation

1. Clone the repository and navigate to the order-service directory:

```bash
cd services/order-service
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Copy environment file:

```bash
cp env.example .env
```

5. Update `.env` with your configuration:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/cloudshop_orders
```

6. Run migrations:

```bash
alembic upgrade head
```

7. Start the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Orders

- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders` - List orders (with pagination)
- `GET /api/v1/orders/{id}` - Get order details
- `PUT /api/v1/orders/{id}` - Update order
- `PUT /api/v1/orders/{id}/status` - Update order status
- `POST /api/v1/orders/{id}/cancel` - Cancel order
- `GET /api/v1/orders/{id}/tracking` - Get order tracking
- `POST /api/v1/orders/{id}/refund` - Request refund
- `GET /api/v1/orders/merchant/{merchant_id}` - Get merchant orders

### Health

- `GET /health` - Health check

## Testing

Run tests with pytest:

```bash
pytest tests/
```

Run with coverage:

```bash
pytest tests/ --cov=app --cov-report=html
```

## Docker

### Build image:

```bash
docker build -t cloudshop-order-service .
```

### Run container:

```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@host.docker.internal:5432/cloudshop_orders \
  cloudshop-order-service
```

### Using docker-compose:

The service is configured in the root `docker-compose.yml`:

```bash
docker-compose up order-service
```

## Database Migrations

### Create a new migration:

```bash
alembic revision --autogenerate -m "description"
```

### Apply migrations:

```bash
alembic upgrade head
```

### Rollback migration:

```bash
alembic downgrade -1
```

## Configuration

Key environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `DEBUG` - Enable debug mode (default: false)
- `CORS_ORIGINS` - Allowed CORS origins
- `SHIPPING_BASE_RATE` - Base shipping rate (default: 5.99)
- `SHIPPING_FREE_THRESHOLD` - Free shipping threshold (default: 50.00)
- `TAX_RATE` - Tax rate (default: 0.08)
- `ENABLE_NOTIFICATIONS` - Enable notifications (default: true)
- `LOG_LEVEL` - Logging level (default: INFO)

## Order Status Flow

```
PENDING → PROCESSING → SHIPPED → DELIVERED
   ↓           ↓
CANCELLED  CANCELLED
                ↓
            REFUNDED
```

## Development

### Code Style

This project follows PEP 8 and uses type hints throughout.

### Adding New Features

1. Create models in `app/models/`
2. Create schemas in `app/schemas/`
3. Implement business logic in `app/services/`
4. Add routes in `app/routes/`
5. Write tests in `tests/`
6. Create migration if needed

## License

See LICENSE file in the project root.

