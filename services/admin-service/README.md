# CloudShop Admin Service

Production-ready Admin Service for CloudShop built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- ✅ **Merchant Management** - Full CRUD operations for merchant accounts
- ✅ **User Management** - Create, read, update, and delete users
- ✅ **System Configuration** - Manage system-wide settings and configurations
- ✅ **Audit Logging** - Comprehensive audit trail for all administrative actions
- ✅ **Security Settings** - Role-based access control (Admin, Moderator)
- ✅ **API Quota Management** - Track and manage API usage quotas for users and merchants
- ✅ **Dashboard Metrics** - Real-time statistics and metrics

## Tech Stack

- **Language**: TypeScript (Node.js 20+)
- **Framework**: Express.js
- **Database**: PostgreSQL with pg driver
- **Logging**: Winston
- **Validation**: Express Validator
- **Authentication**: JWT (integrates with Auth Service)

## Project Structure

```
admin-service/
├── src/
│   ├── config/              # Configuration management
│   │   ├── index.ts
│   │   ├── database.ts
│   │   └── logger.ts
│   ├── controllers/         # HTTP request handlers
│   │   ├── dashboard.controller.ts
│   │   ├── user.controller.ts
│   │   ├── merchant.controller.ts
│   │   ├── config.controller.ts
│   │   ├── audit.controller.ts
│   │   ├── quota.controller.ts
│   │   └── health.controller.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── authorization.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logger.middleware.ts
│   │   └── validator.middleware.ts
│   ├── routes/              # Route configuration
│   │   ├── index.ts
│   │   ├── dashboard.routes.ts
│   │   ├── user.routes.ts
│   │   ├── merchant.routes.ts
│   │   ├── config.routes.ts
│   │   ├── audit.routes.ts
│   │   └── quota.routes.ts
│   ├── services/            # Business logic
│   │   ├── user.service.ts
│   │   ├── merchant.service.ts
│   │   ├── config.service.ts
│   │   ├── audit.service.ts
│   │   ├── quota.service.ts
│   │   └── dashboard.service.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Helper functions
│   │   ├── errors.ts
│   │   ├── jwt.ts
│   │   └── password.ts
│   └── index.ts             # Application entry point
├── migrations/              # Database migrations
│   ├── 001_create_merchants_table.sql
│   ├── 002_create_system_config_table.sql
│   ├── 003_create_audit_logs_table.sql
│   ├── 004_create_api_quotas_table.sql
│   └── migrate.ts
├── Dockerfile
├── env.example
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Dashboard

- `GET /dashboard/metrics` - Get dashboard metrics and statistics

### User Management

- `POST /users` - Create a new user
- `GET /users` - Get all users (with pagination)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Merchant Management

- `POST /merchants` - Create a new merchant
- `GET /merchants` - Get all merchants (with pagination, optional status filter)
- `GET /merchants/:id` - Get merchant by ID
- `PUT /merchants/:id` - Update merchant
- `DELETE /merchants/:id` - Delete merchant

### System Configuration

- `POST /config` - Create a new configuration entry
- `GET /config` - Get all configurations (optional category filter)
- `GET /config/:key` - Get configuration by key
- `PUT /config/:key` - Update configuration
- `DELETE /config/:key` - Delete configuration

### Audit Logs

- `GET /audit` - Get audit logs (with filtering and pagination)
- `GET /audit/stats` - Get audit statistics
- `GET /audit/:id` - Get audit log by ID

### API Quota Management

- `POST /quotas` - Create a new API quota
- `GET /quotas` - Get all quotas (with pagination)
- `GET /quotas/:id` - Get quota by ID
- `PUT /quotas/:id` - Update quota
- `DELETE /quotas/:id` - Delete quota

### Health Check

- `GET /health` - Health check endpoint

## Authentication & Authorization

All endpoints (except `/health`) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Roles

- **ADMIN** - Full access to all endpoints
- **MODERATOR** - Read access to merchants, audit logs

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=3006
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudshop
DB_USER=cloudshop
DB_PASSWORD=cloudshop
JWT_SECRET=your-jwt-secret
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the service:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Database Migrations

The service uses SQL migrations stored in the `migrations/` directory.

Run migrations:
```bash
npm run migrate
```

## Docker

Build and run with Docker:

```bash
docker build -t cloudshop-admin-service .
docker run -p 3006:3006 --env-file .env cloudshop-admin-service
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3006` |
| `HOST` | Server host | `0.0.0.0` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `cloudshop` |
| `DB_USER` | Database user | `cloudshop` |
| `DB_PASSWORD` | Database password | `cloudshop` |
| `JWT_SECRET` | JWT secret for token verification | Required |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |

## Features Details

### Merchant Management

- Create merchants with business information
- Update merchant details and status
- Filter merchants by status (active, inactive, suspended, pending)
- Track merchant creation with audit logs

### User Management

- Create users with role assignment
- Update user details, roles, and email verification status
- Paginated user listing
- Password hashing with bcrypt

### System Configuration

- Key-value configuration storage
- Support for different value types (string, number, boolean, JSON)
- Category-based organization
- Optional encryption flag for sensitive values

### Audit Logging

- Automatic logging of all administrative actions
- Track user actions, resource types, and timestamps
- Filter by user, action, resource type, status, and date range
- Audit statistics and reporting

### API Quota Management

- Set daily and monthly API limits
- Track usage per user or merchant
- Automatic quota reset (daily and monthly)
- Quota status checking

### Dashboard Metrics

- Total users and merchants count
- Active and pending merchants count
- Total audit logs
- Recent audit activity
- API quota usage statistics

## Error Handling

The service uses a consistent error response format:

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {}
  }
}
```

## Logging

Logs are written to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Console - In non-production environments

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## License

Part of the CloudShop project.

