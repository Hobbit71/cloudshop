# CloudShop Auth Service

Production-ready authentication and authorization service for CloudShop built with Express.js, TypeScript, PostgreSQL, and Redis.

## Features

- ✅ User registration with validation
- ✅ User login with JWT tokens
- ✅ Token refresh mechanism
- ✅ Password hashing with bcrypt
- ✅ Multi-factor authentication (MFA/TOTP)
- ✅ Role-based access control (RBAC)
- ✅ Session management with Redis
- ✅ Comprehensive error handling
- ✅ Request logging and rate limiting
- ✅ Health checks
- ✅ Docker support
- ✅ Database migrations

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT tokens
- `POST /auth/logout` - Logout (invalidate session)
- `POST /auth/logout-all` - Logout from all devices
- `POST /auth/refresh-token` - Refresh access token
- `GET /auth/profile` - Get current user profile (requires auth)

### MFA

- `POST /auth/mfa/setup` - Setup MFA (requires auth)
- `POST /auth/mfa/verify` - Verify and enable MFA (requires auth)
- `POST /auth/mfa/disable` - Disable MFA (requires auth)
- `GET /auth/mfa/status` - Get MFA status (requires auth)

### Health

- `GET /health` - Health check endpoint

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Run database migrations:
```bash
npm run migrate
```

5. Start the service:
```bash
npm run dev
```

### Docker

1. From the project root, start all services:
```bash
docker-compose up -d
```

2. Run migrations inside the auth container:
```bash
docker-compose exec auth npm run migrate
```

## Configuration

Key environment variables:

- `PORT` - Server port (default: 3001)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `JWT_SECRET` - JWT signing secret (required in production)
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiry (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiry (default: 7d)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)

## Database Schema

### users
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role` (VARCHAR, default: 'user')
- `email_verified` (BOOLEAN, default: false)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### mfa_secrets
- `user_id` (UUID, Primary Key, Foreign Key to users)
- `secret` (VARCHAR)
- `is_enabled` (BOOLEAN, default: false)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Building

```bash
npm run build
```

## Production Deployment

1. Build the Docker image:
```bash
docker build -t cloudshop-auth .
```

2. Run with proper environment variables and dependencies (PostgreSQL, Redis)

3. Run migrations:
```bash
npm run migrate
```

## Security Notes

- Always use strong JWT secrets in production
- Ensure HTTPS in production
- Regularly rotate secrets
- Use environment variables for sensitive configuration
- Keep dependencies up to date

## License

MIT

