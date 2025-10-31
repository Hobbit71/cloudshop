# CloudShop Inventory Service

Production-ready Inventory Service for CloudShop built with Node.js, Express, TypeScript, PostgreSQL, Redis, and Socket.io for real-time inventory tracking.

## Features

- ✅ Real-time inventory tracking with Socket.io
- ✅ Stock reservations during checkout with automatic expiration
- ✅ Multi-warehouse inventory synchronization
- ✅ Low stock alerts with automatic monitoring
- ✅ Inventory forecasting based on historical sales data
- ✅ Barcode scanning support
- ✅ Redis caching for improved performance
- ✅ Comprehensive error handling
- ✅ Database migrations
- ✅ Health checks
- ✅ Docker support

## Tech Stack

- **Language**: TypeScript (Node.js 20+)
- **Framework**: Express.js
- **Database**: PostgreSQL with pg driver
- **Cache**: Redis
- **Real-time**: Socket.io
- **Logging**: Winston
- **Testing**: Jest

## Project Structure

```
inventory-service/
├── src/
│   ├── config/              # Configuration management
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── logger.ts
│   ├── controllers/         # HTTP request handlers
│   │   ├── inventory.controller.ts
│   │   ├── reservation.controller.ts
│   │   ├── transfer.controller.ts
│   │   └── health.controller.ts
│   ├── middleware/          # Custom middleware
│   │   ├── error.middleware.ts
│   │   ├── logger.middleware.ts
│   │   └── validator.middleware.ts
│   ├── routes/              # Route configuration
│   │   ├── index.ts
│   │   ├── inventory.routes.ts
│   │   ├── reservation.routes.ts
│   │   └── transfer.routes.ts
│   ├── services/            # Business logic
│   │   ├── inventory.service.ts
│   │   ├── reservation.service.ts
│   │   ├── transfer.service.ts
│   │   ├── forecasting.service.ts
│   │   ├── socket.service.ts
│   │   └── repository/      # Data access layer
│   │       ├── inventory.repository.ts
│   │       ├── reservation.repository.ts
│   │       ├── transfer.repository.ts
│   │       └── lowstock.repository.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Helper functions
│   │   └── errors.ts
│   └── index.ts             # Application entry point
├── migrations/              # Database migrations
│   ├── 001_create_warehouses_table.sql
│   ├── 002_create_inventory_table.sql
│   ├── 003_create_reservations_table.sql
│   ├── 004_create_transfers_table.sql
│   ├── 005_create_low_stock_alerts_table.sql
│   ├── 006_create_inventory_history_table.sql
│   └── migrate.ts
├── tests/                   # Test suite
├── Dockerfile
├── package.json
├── tsconfig.json
└── env.example
```

## API Endpoints

### Inventory Management

- `GET /api/v1/inventory/{product_id}` - Get inventory for a product
  - Query params: `warehouse_id` (optional) - Filter by warehouse
- `GET /api/v1/inventory/barcode/{barcode}` - Get inventory by barcode
- `PUT /api/v1/inventory/{product_id}` - Update inventory
  - Query params: `warehouse_id` (required)
  - Body: `quantity`, `barcode`, `location`, `reorder_point`, `max_stock`
- `GET /api/v1/inventory/low-stock` - Get low stock items
  - Query params: `threshold` (optional), `warehouse_id` (optional)

### Stock Reservations

- `POST /api/v1/inventory/reserve` - Reserve stock for checkout
  - Body: `product_id`, `warehouse_id`, `quantity`, `order_id` (optional), `session_id` (optional), `expires_in` (optional)
- `POST /api/v1/inventory/reserve/{id}/confirm` - Confirm a reservation
- `POST /api/v1/inventory/reserve/{id}/release` - Release a reservation

### Warehouse Transfers

- `POST /api/v1/inventory/transfer` - Create inventory transfer
  - Body: `product_id`, `from_warehouse_id`, `to_warehouse_id`, `quantity`, `requested_by` (optional), `notes` (optional)
- `POST /api/v1/inventory/transfer/{id}/start` - Start a transfer (moves to in-transit)
- `POST /api/v1/inventory/transfer/{id}/complete` - Complete a transfer
- `POST /api/v1/inventory/transfer/{id}/cancel` - Cancel a transfer

### Health Check

- `GET /health` - Service health check

## Real-time Updates (Socket.io)

The service provides real-time inventory updates via Socket.io:

### Events

**Client → Server:**
- `subscribe:inventory` - Subscribe to inventory updates for a product
  - Data: `{ product_id: string, warehouse_id?: string }`
- `subscribe:low-stock` - Subscribe to low stock alerts
  - Data: `{ warehouse_id?: string }` (optional)

**Server → Client:**
- `inventory:update` - Emitted when inventory changes
  - Data: `InventoryItem`
- `low-stock:alert` - Emitted when low stock threshold is reached
  - Data: `{ product_id, warehouse_id, current_quantity, reorder_point }`

### Example Client Code

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3003');

// Subscribe to inventory updates
socket.emit('subscribe:inventory', {
  product_id: 'product-uuid',
  warehouse_id: 'warehouse-uuid'
});

socket.on('inventory:update', (inventory) => {
  console.log('Inventory updated:', inventory);
});

// Subscribe to low stock alerts
socket.emit('subscribe:low-stock', {
  warehouse_id: 'warehouse-uuid' // optional
});

socket.on('low-stock:alert', (alert) => {
  console.log('Low stock alert:', alert);
});
```

## Configuration

Key environment variables (see `env.example`):

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL configuration
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` - Redis configuration
- `SOCKET_IO_CORS_ORIGIN` - Socket.io CORS origins
- `RESERVATION_TTL` - Reservation expiration time in seconds (default: 1800)
- `LOW_STOCK_THRESHOLD` - Default low stock threshold (default: 10)
- `FORECASTING_LOOKBACK_DAYS` - Days of history for forecasting (default: 90)
- `CORS_ORIGIN` - Allowed CORS origins
- `PORT` - Service port (default: 3003)

## Database Schema

The service uses the following tables:

- `warehouses` - Warehouse information
- `inventory` - Product inventory per warehouse
- `reservations` - Stock reservations for checkout
- `transfers` - Multi-warehouse inventory transfers
- `low_stock_alerts` - Low stock alert tracking
- `inventory_history` - Historical inventory changes for forecasting

## Running Locally

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Setup

```bash
cd services/inventory-service

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Update .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

## Docker

The service is containerized and can be run with Docker Compose:

```bash
docker compose up inventory-service
```

Or build individually:

```bash
docker build -t cloudshop-inventory-service ./services/inventory-service
docker run -p 3003:3003 cloudshop-inventory-service
```

## Features in Detail

### Real-time Inventory Tracking

- All inventory changes emit real-time updates via Socket.io
- Clients can subscribe to specific products or warehouses
- Updates include current quantity, reserved quantity, and available quantity

### Stock Reservations

- Reservations are created during checkout to prevent overselling
- Automatic expiration after configurable TTL (default: 30 minutes)
- Reservations can be tied to orders or sessions
- Automatic cleanup of expired reservations (runs every 5 minutes)

### Multi-warehouse Support

- Track inventory across multiple warehouses
- Transfer inventory between warehouses
- Warehouse-specific low stock alerts
- Per-warehouse inventory queries

### Low Stock Alerts

- Automatic monitoring of inventory levels
- Alerts triggered when available quantity ≤ reorder point
- Real-time alerts via Socket.io
- Historical alert tracking

### Inventory Forecasting

- Uses historical sales data to predict future inventory needs
- Calculates days until stockout
- Recommends order quantities
- Confidence score based on historical data availability

### Barcode Scanning

- Support for barcode-based inventory lookup
- Unique barcode per product/warehouse combination
- Fast lookup via indexed barcode column

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Best Practices

- ✅ Separation of concerns (Controller → Service → Repository)
- ✅ TypeScript for type safety
- ✅ Comprehensive error handling
- ✅ Request validation with express-validator
- ✅ Real-time updates for better UX
- ✅ Redis caching for performance
- ✅ Database migrations for schema management
- ✅ Health checks for monitoring
- ✅ Comprehensive logging
- ✅ Automatic cleanup of expired reservations

## License

Part of the CloudShop project.

