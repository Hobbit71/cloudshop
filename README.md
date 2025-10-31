# CloudShop

CloudShop is a modern, cloud-native e-commerce platform designed to showcase best-in-class DevSecOps practices using containerized n-tier architecture. This application demonstrates the complete software delivery lifecycle, including continuous integration, continuous delivery, infrastructure provisioning, security testing, feature management, and cloud cost optimization - all capabilities that align with the Harness platform's comprehensive approach to modern software delivery.

The application serves as an ideal reference implementation for organizations seeking to accelerate innovation velocity, drive continuous quality and resilience, secure and govern software delivery, and optimize cloud costs and engineering processes.

## Architecture Overview

CloudShop is a microservices-based application consisting of:

- **Auth Service** (Express.js/TypeScript) - Authentication and authorization with JWT, MFA, and RBAC
- **Product Service** (Spring Boot/Java) - Product management with Elasticsearch search and Redis caching
- **Order Service** (FastAPI/Python) - Order processing with validation, shipping, and refunds
- **Payment Service** (Go/Gin) - Multi-gateway payment processing with Stripe and PayPal integration
- **Web Frontend** (React/TypeScript) - Modern SPA built with Vite, Tailwind CSS, and React Query

All services communicate via REST APIs and are containerized with Docker.

## Prerequisites

Before setting up CloudShop, ensure you have the following installed:

### Required
- **Docker** 20.10+ and **Docker Compose** 2.0+ (for containerized deployment)
- **Git** 2.0+

### Optional (for native development)
- **Node.js** 20+ and **npm** (for Auth Service and Web Frontend)
- **Java** 21+ and **Maven** 3.9+ (for Product Service)
- **Python** 3.11+ and **pip** (for Order Service)
- **PostgreSQL** 16+ (if running database locally)
- **Redis** 7+ (if running Redis locally)
- **Elasticsearch** 8.15+ (if running Elasticsearch locally)

## Repository Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cloudshop
```

### 2. Environment Configuration

While Docker Compose can run with default values, you may want to customize configuration. Create a `.env` file in the root directory if you need to override defaults:

```bash
# Database Configuration
POSTGRES_USER=cloudshop
POSTGRES_PASSWORD=cloudshop
POSTGRES_DB=cloudshop
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PORT=6379

# Elasticsearch Configuration
ELASTIC_PORT=9200

# Service Ports
AUTH_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=8000
PAYMENT_SERVICE_PORT=8081
PAYMENT_MOCK_PORT=8080

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Origins
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

Alternatively, use the Makefile:

```bash
make setup
```

This will create a `.env` file from `.env.example` if it doesn't exist.

## Building the Project

### Option 1: Build with Docker Compose (Recommended)

Build all services and infrastructure:

```bash
# Build all images
docker compose build

# Or using Makefile
make build
```

This will build Docker images for:
- Auth Service
- Product Service
- Order Service
- Payment Service
- Infrastructure services (PostgreSQL, Redis, Elasticsearch, Payment Mock)

### Option 2: Build Services Individually

#### Auth Service
```bash
cd services/auth
npm install
```

#### Product Service
```bash
cd services/product-service
mvn clean install
```

#### Order Service
```bash
cd services/order-service
pip install -r requirements.txt
```

#### Web Frontend
```bash
cd web
npm install
```

## Running Locally

### Option 1: Docker Compose (Recommended)

This is the easiest way to run the entire platform:

1. **Start all services:**
   ```bash
   docker compose up -d
   
   # Or using Makefile
   make dev
   ```

2. **Run database migrations for Auth Service:**
   ```bash
   docker compose exec auth npm run migrate
   ```

3. **Run database migrations for Order Service:**
   ```bash
   docker compose exec order-service alembic upgrade head
   ```

4. **Verify services are running:**
   ```bash
   docker compose ps
   ```

   You should see all services in "healthy" status:
   - `cloudshop-postgres` (PostgreSQL)
   - `cloudshop-redis` (Redis)
   - `cloudshop-elasticsearch` (Elasticsearch)
   - `cloudshop-payment-mock` (WireMock)
   - `cloudshop-auth` (Auth Service on port 3001)
   - `cloudshop-product-service` (Product Service on port 3002)
   - `cloudshop-order-service` (Order Service on port 8000)
   - `cloudshop-payment-service` (Payment Service on port 8081)

5. **Check service health:**
   - Auth Service: http://localhost:3001/health
   - Product Service: http://localhost:3002/health
   - Order Service: http://localhost:8000/health
   - Payment Service: http://localhost:8081/health

6. **Stop all services:**
   ```bash
   docker compose down
   
   # Or to remove volumes
   docker compose down -v
   
   # Or using Makefile
   make clean
   ```

### Option 2: Native Development

For native development, you'll need to start infrastructure services and run each service locally.

#### Step 1: Start Infrastructure Services

Start only the infrastructure (database, cache, etc.):

```bash
docker compose up -d postgres redis elasticsearch payment-mock
```

Or use the Makefile:

```bash
make dev
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Elasticsearch on port 9200
- Payment Mock (WireMock) on port 8080

#### Step 2: Run Auth Service

```bash
cd services/auth

# Copy environment file
cp env.example .env

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Auth Service will run on http://localhost:3001

#### Step 3: Run Product Service

```bash
cd services/product-service

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Or with dev profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Product Service will run on http://localhost:3002

#### Step 4: Run Order Service

```bash
cd services/order-service

# Copy environment file
cp env.example .env

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Order Service will run on http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

#### Step 5: Run Web Frontend

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

Web Frontend will run on http://localhost:5173

## Service-Specific Configuration

### Auth Service

Key environment variables (see `services/auth/env.example`):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `JWT_SECRET` - JWT signing secret (required)
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiry (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiry (default: 7d)
- `CORS_ORIGIN` - Allowed CORS origins

### Product Service

Key environment variables (configured in `application.yml`):
- Database connection settings
- Redis connection settings
- Elasticsearch connection settings
- Server port (default: 3002)

### Order Service

Key environment variables (see `services/order-service/env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SERVICE_URL` - Auth service endpoint
- `PRODUCT_SERVICE_URL` - Product service endpoint
- `PAYMENT_SERVICE_URL` - Payment service endpoint
- `SHIPPING_BASE_RATE`, `SHIPPING_FREE_THRESHOLD` - Shipping configuration
- `TAX_RATE` - Tax rate (default: 0.08)

### Payment Service

Key environment variables (see `services/payment-service/env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret for authentication
- `AUTH_SERVICE_URL` - Auth service endpoint for token validation
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Stripe integration (optional)
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` - PayPal integration (optional)
- `CORS_ORIGINS` - Allowed CORS origins
- `LOG_LEVEL` - Logging level (default: info)

## Testing

### Run All Tests (Docker)

```bash
# Auth Service tests
docker compose exec auth npm test

# Product Service tests
docker compose exec product-service mvn test

# Order Service tests
docker compose exec order-service pytest

# Payment Service tests
docker compose exec payment-service go test ./...

# Web Frontend tests
cd web && npm test
```

### Run Tests Locally

**Auth Service:**
```bash
cd services/auth
npm test
```

**Product Service:**
```bash
cd services/product-service
mvn test
```

**Order Service:**
```bash
cd services/order-service
pytest
```

**Payment Service:**
```bash
cd services/payment-service
go test ./...
```

**Web Frontend:**
```bash
cd web
npm test
npm run test:coverage  # With coverage report
```

## API Documentation

Once services are running:

- **Order Service API Docs**: http://localhost:8000/docs (Swagger UI)
- **Order Service ReDoc**: http://localhost:8000/redoc
- **Product Service**: Check `services/product-service/README.md` for endpoint details
- **Auth Service**: Check `services/auth/README.md` for endpoint details
- **Payment Service**: Check `services/payment-service/README.md` for endpoint details

## Troubleshooting

### Services won't start

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check for port conflicts:**
   Ensure ports 3001, 3002, 8000, 8081, 5432, 6379, 9200, 8080 are not in use.

3. **Check service logs:**
   ```bash
   docker compose logs <service-name>
   # e.g., docker compose logs auth
   ```

4. **Restart services:**
   ```bash
   docker compose restart
   ```

### Database connection issues

1. **Verify PostgreSQL is running:**
   ```bash
   docker compose ps postgres
   ```

2. **Check database is accessible:**
   ```bash
   docker compose exec postgres psql -U cloudshop -d cloudshop -c "SELECT 1;"
   ```

3. **Reset database (will delete all data):**
   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Migration issues

**Auth Service:**
```bash
docker compose exec auth npm run migrate
```

**Order Service:**
```bash
docker compose exec order-service alembic upgrade head
```

## Development Workflow

1. Make code changes in the respective service directory
2. If using Docker, rebuild the service:
   ```bash
   docker compose build <service-name>
   docker compose up -d <service-name>
   ```
3. If running natively, the service should hot-reload automatically
4. Run tests before committing changes

## Additional Resources

- [CHANGELOG.md](./CHANGELOG.md) - Detailed changelog of all changes
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Code of conduct
- Service-specific READMEs in each service directory:
  - `services/auth/README.md`
  - `services/product-service/README.md`
  - `services/order-service/README.md`
  - `services/payment-service/README.md`
