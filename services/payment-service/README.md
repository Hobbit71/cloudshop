# CloudShop Payment Service

Production-ready Payment Service for CloudShop built with Go, Gin, PostgreSQL, and payment gateway integrations (Stripe, PayPal).

## Features

- ✅ Multi-gateway payment processing (Stripe, PayPal)
- ✅ PCI-DSS compliance (no storing card details)
- ✅ Payment webhook handling with signature verification
- ✅ Idempotent payment operations
- ✅ Refund processing and tracking
- ✅ Payment retry logic
- ✅ Concurrency-safe payment processing
- ✅ Audit logging for compliance
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Comprehensive error handling
- ✅ Database migrations
- ✅ Health checks
- ✅ Docker support

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin
- **Database**: PostgreSQL with pgx driver
- **Payment Gateways**: Stripe, PayPal
- **Logging**: Zap
- **Testing**: Go testing package

## Project Structure

```
payment-service/
├── main.go                 # Application entry point
├── config/                 # Configuration management
│   ├── config.go
│   └── database.go
├── models/                 # Data structures
│   ├── payment.go
│   └── audit.go
├── handlers/               # HTTP request handlers
│   ├── payment_handler.go
│   ├── webhook_handler.go
│   └── health_handler.go
├── services/               # Business logic
│   ├── payment_service.go
│   ├── stripe_service.go
│   ├── paypal_service.go
│   ├── webhook_service.go
│   └── refund_service.go
├── repository/             # Database operations
│   ├── payment_repository.go
│   └── audit_repository.go
├── middleware/             # Custom middleware
│   ├── auth_middleware.go
│   ├── error_middleware.go
│   ├── logger_middleware.go
│   ├── rate_limit_middleware.go
│   └── cors_middleware.go
├── routes/                 # Route configuration
│   └── routes.go
├── utils/                  # Helper functions
│   ├── idempotency.go
│   └── errors.go
├── migrations/             # Database migrations
│   ├── 001_create_payments_table.up.sql
│   ├── 001_create_payments_table.down.sql
│   ├── 002_create_audit_logs_table.up.sql
│   └── 002_create_audit_logs_table.down.sql
├── tests/                  # Test suite
├── Dockerfile
├── env.example
├── go.mod
└── README.md
```

## API Endpoints

### Payments

- `POST /api/v1/payments` - Create payment
- `GET /api/v1/payments/{id}` - Get payment details
- `POST /api/v1/payments/{id}/refund` - Refund payment
- `POST /api/v1/payments/{id}/capture` - Capture pre-auth payment
- `GET /api/v1/payments/order/{order_id}` - Get order payments

### Webhooks

- `POST /api/v1/payments/webhook` - Payment gateway webhook

### Health

- `GET /health` - Health check endpoint

## Quick Start

### Prerequisites

- Go 1.21+
- PostgreSQL 16+
- Docker (optional)

### Local Development

1. **Install dependencies:**
```bash
go mod download
```

2. **Copy environment variables:**
```bash
cp env.example .env
```

3. **Update `.env` with your configuration:**
   - Database connection string
   - JWT secret
   - Payment gateway API keys (Stripe, PayPal)

4. **Run database migrations:**
```bash
# Install migrate tool
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Run migrations
migrate -path migrations -database "postgres://cloudshop:cloudshop@localhost:5432/cloudshop_payments?sslmode=disable" up
```

5. **Start the service:**
```bash
go run main.go
```

The service will start on port `8081` by default.

### Docker

1. **Build the image:**
```bash
docker build -t payment-service .
```

2. **Run the container:**
```bash
docker run -p 8081:8081 --env-file .env payment-service
```

## Configuration

Key environment variables:

- `PORT` - Server port (default: 8081)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key for token verification
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `PAYPAL_MODE` - PayPal mode (sandbox or live)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins
- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: true)
- `LOG_LEVEL` - Log level (debug, info, warn, error)

See `env.example` for all available configuration options.

## Database Migrations

Migrations are located in the `migrations/` directory. Use the `migrate` tool to manage them:

```bash
# Run migrations
migrate -path migrations -database "$DATABASE_URL" up

# Rollback last migration
migrate -path migrations -database "$DATABASE_URL" down 1

# Check migration status
migrate -path migrations -database "$DATABASE_URL" version
```

## Testing

Run tests:
```bash
go test ./...
```

Run tests with coverage:
```bash
go test -cover ./...
```

## Payment Gateway Integration

### Stripe

1. Get your Stripe API keys from the Stripe Dashboard
2. Set `STRIPE_SECRET_KEY` in your environment
3. Configure webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/v1/payments/webhook?gateway=stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Set `STRIPE_WEBHOOK_SECRET` from the webhook configuration

### PayPal

1. Get your PayPal client credentials from PayPal Developer Dashboard
2. Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in your environment
3. Configure webhook in PayPal Dashboard:
   - URL: `https://your-domain.com/api/v1/payments/webhook?gateway=paypal`
   - Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`
4. Set `PAYPAL_WEBHOOK_ID` from the webhook configuration
5. Set `PAYPAL_MODE` to `sandbox` for testing or `live` for production

## Security Considerations

1. **PCI-DSS Compliance**: This service does not store sensitive card information. Payment processing is handled entirely by payment gateways.

2. **Webhook Security**: All webhooks are verified using gateway-provided signatures before processing.

3. **Authentication**: All payment endpoints require JWT authentication (except webhooks which use signature verification).

4. **Rate Limiting**: Rate limiting is enabled by default to prevent abuse.

5. **Audit Logging**: All payment operations are logged for compliance and debugging.

## Performance & Reliability

- Connection pooling for database connections
- Prepared statement caching
- Concurrent payment processing with mutex locks
- Graceful shutdown handling
- Retry logic for failed payments
- Proper error handling and logging

## License

See LICENSE file in the project root.

