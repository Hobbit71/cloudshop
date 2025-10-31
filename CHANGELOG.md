# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

### Added
- Initial project scaffolding: polyglot devcontainer, docker-compose infra, Makefile
- Repository documentation: README, CONTRIBUTING, Code of Conduct, Changelog template
- Combined .gitignore for Node.js, Python, Java, and Go
- React TypeScript SPA with Vite, Tailwind, routing, state management
- Comprehensive API service layer with interceptors and error handling
- Zustand stores for application state management
- Custom React hooks for common patterns
- Comprehensive testing setup with Vitest and React Testing Library
- **Auth Service** (Express.js/TypeScript)
  - User registration and authentication with JWT tokens
  - Token refresh mechanism with secure session management
  - Multi-factor authentication (MFA/TOTP) support
  - Role-based access control (RBAC) middleware
  - Password hashing with bcrypt
  - Session management with Redis
  - RESTful API endpoints: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/logout-all`, `/auth/refresh-token`, `/auth/profile`
  - MFA endpoints: `/auth/mfa/setup`, `/auth/mfa/verify`, `/auth/mfa/disable`, `/auth/mfa/status`
  - Health check endpoint: `/health`
  - Database migrations for users and MFA secrets tables
  - Comprehensive error handling and request validation
  - Request logging middleware
  - Docker support and configuration
- **Product Service** (Spring Boot/Java)
  - RESTful API for product management with full CRUD operations
  - Full-text search with Elasticsearch integration
  - Redis caching for improved performance
  - Product variants support (size, color, SKU)
  - Rating and reviews system
  - Category management with hierarchical structure
  - Bulk product import via CSV
  - Image upload support for products
  - Advanced pagination, sorting, and filtering
  - Merchant-specific product management (requires X-Merchant-Id header)
  - API endpoints:
    - Products: `GET /api/v1/products`, `POST /api/v1/products`, `PUT /api/v1/products/{id}`, `DELETE /api/v1/products/{id}`
    - Search: `GET /api/v1/products/search`
    - Categories: `GET /api/v1/categories`, `GET /api/v1/categories/{id}`, `GET /api/v1/categories/slug/{slug}`
    - Bulk operations: `POST /api/v1/products/bulk-import`
    - Images: `POST /api/v1/products/{id}/images`
  - Health check endpoint: `/health`
  - Comprehensive test coverage with JUnit
  - Docker support and configuration
- **Order Service** (FastAPI/Python)
  - Order creation with comprehensive validation
  - Order status tracking with state machine (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
  - Order history with pagination support
  - Order cancellation and refund processing
  - Shipping cost and tax calculation
  - Order notifications service integration
  - Merchant order management
  - RESTful API endpoints:
    - `POST /api/v1/orders` - Create order
    - `GET /api/v1/orders` - List orders with pagination
    - `GET /api/v1/orders/{id}` - Get order details
    - `PUT /api/v1/orders/{id}` - Update order
    - `PUT /api/v1/orders/{id}/status` - Update order status
    - `POST /api/v1/orders/{id}/cancel` - Cancel order
    - `GET /api/v1/orders/{id}/tracking` - Order tracking
    - `POST /api/v1/orders/{id}/refund` - Request refund
    - `GET /api/v1/orders/merchant/{merchant_id}` - Get merchant orders
  - Services: OrderService, OrderValidationService, OrderNotificationService, ShippingService, RefundService
  - PostgreSQL database with async SQLAlchemy
  - Alembic migrations for database schema management
  - Pydantic schemas for request/response validation
  - Custom exception handlers and request logging middleware
  - Comprehensive test suite with pytest
  - Docker support and configuration
- **Payment Service** (Go/Gin)
  - Multi-gateway payment processing with Stripe and PayPal integration
  - PCI-DSS compliance (no storing card details)
  - Payment webhook handling with signature verification
  - Idempotent payment operations
  - Refund processing and tracking
  - Payment retry logic with configurable retry attempts
  - Concurrency-safe payment processing with mutex locks
  - Audit logging for compliance and transaction history
  - JWT authentication middleware for secure endpoints
  - Rate limiting middleware
  - Comprehensive error handling with structured API errors
  - Database migrations for payments and audit logs tables
  - Health check endpoint: `/health`
  - RESTful API endpoints:
    - `POST /api/v1/payments` - Process payment
    - `GET /api/v1/payments/{id}` - Get payment details
    - `POST /api/v1/payments/{id}/refund` - Process refund
    - `GET /api/v1/payments` - List payments with pagination
    - `POST /api/v1/webhooks/stripe` - Stripe webhook handler
    - `POST /api/v1/webhooks/paypal` - PayPal webhook handler
  - PostgreSQL database with pgx driver
  - Structured logging with Zap
  - Docker support and configuration

### Changed
- Updated `docker-compose.yml` to include product-service, order-service, and payment-service configurations
  - Added product-service with dependencies on PostgreSQL, Redis, and Elasticsearch
  - Added order-service with dependency on PostgreSQL
  - Added payment-service with dependency on PostgreSQL
  - All services include health checks and proper network configuration

### Deprecated

### Removed

### Fixed
- Added missing `.env.example` file for environment configuration
- Updated README to document Payment Service architecture and configuration
- Fixed Makefile reference to non-existent `.env.example` file

### Security

## [0.1.0] - Unreleased

### Added
- First tagged pre-release

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/tag/v0.1.0
