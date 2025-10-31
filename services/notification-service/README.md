# Notification Service

Notification service for CloudShop providing email, SMS, push, and in-app notifications.

## Features

- **Email Notifications** - Send emails via SendGrid
- **SMS Notifications** - Send SMS via Twilio
- **Push Notifications** - Send push notifications via Firebase Cloud Messaging (FCM)
- **In-App Notifications** - Manage in-app notifications with read/unread tracking
- **Notification Templates** - Create and manage reusable notification templates
- **Delivery Tracking** - Track notification delivery status and events

## Celery Jobs

The service includes the following Celery background jobs:

1. **send_order_confirmation_email** - Sends order confirmation emails
2. **send_shipping_notification** - Sends shipping notifications with tracking information
3. **send_order_reminder** - Sends order reminders (e.g., cart abandonment)
4. **send_promotional_emails** - Sends promotional emails to multiple users

## Technology Stack

- **Framework**: FastAPI
- **Task Queue**: Celery with Redis
- **Database**: PostgreSQL (async with SQLAlchemy)
- **Email**: SendGrid
- **SMS**: Twilio
- **Push**: Firebase Cloud Messaging (FCM)

## Setup

1. Copy environment file:
   ```bash
   cp env.example .env
   ```

2. Configure environment variables in `.env`:
   - Database connection
   - Redis connection (for Celery)
   - SendGrid API key
   - Twilio credentials
   - FCM server key (optional)

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database migrations (using Alembic):
   ```bash
   alembic upgrade head
   ```

## Running the Service

### Development Mode

Run the API server:
```bash
uvicorn app.main:app --reload --port 8002
```

Run Celery worker:
```bash
celery -A app.celery_app worker --loglevel=info
```

Run Celery beat (for scheduled tasks):
```bash
celery -A app.celery_app beat --loglevel=info
```

### Docker

Build and run with docker-compose (see main project docker-compose.yml).

## API Endpoints

### Notifications

- `POST /api/v1/notifications` - Create and send a notification
- `GET /api/v1/notifications` - List notifications (with filters)
- `GET /api/v1/notifications/{id}` - Get a specific notification
- `POST /api/v1/notifications/tasks/order-confirmation` - Trigger order confirmation email
- `POST /api/v1/notifications/tasks/shipping-notification` - Trigger shipping notification
- `POST /api/v1/notifications/tasks/order-reminder` - Trigger order reminder
- `POST /api/v1/notifications/tasks/promotional-emails` - Trigger promotional emails

### Templates

- `POST /api/v1/templates` - Create a notification template
- `GET /api/v1/templates` - List templates
- `GET /api/v1/templates/{name}` - Get a specific template
- `PUT /api/v1/templates/{name}` - Update a template
- `DELETE /api/v1/templates/{name}` - Delete a template

### Health

- `GET /health` - Health check endpoint

## Templates

Templates use Python's `string.Template` format. Variables are substituted using `$variable` or `${variable}` syntax.

Example template:
```
Subject: Order Confirmation #${order_id}
Body: Hello ${user_name}, thank you for your order #${order_id}. Your total is $${order_total}.
```

## Database Models

- **Notification** - Stores all notifications with status tracking
- **NotificationTemplate** - Stores reusable notification templates
- **DeliveryTracking** - Tracks delivery events (sent, delivered, opened, etc.)

## Environment Variables

See `env.example` for all available environment variables.

