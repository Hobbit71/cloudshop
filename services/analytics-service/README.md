# CloudShop Analytics Service

Production-ready Analytics Service for CloudShop built with Spring Boot 3.2, Apache Kafka, Elasticsearch, and PostgreSQL.

## Features

- ✅ Real-time event processing via Apache Kafka
- ✅ Sales analytics with product-level metrics
- ✅ Customer analytics and behavior tracking
- ✅ Product performance metrics (views, conversions, revenue)
- ✅ Revenue tracking and reporting
- ✅ Custom report generation
- ✅ Event storage in PostgreSQL and Elasticsearch
- ✅ Health checks and monitoring
- ✅ Docker support

## Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 3.2
- **Database**: PostgreSQL 16+
- **Search**: Elasticsearch 8.15+
- **Messaging**: Apache Kafka
- **Build Tool**: Maven 3.9+

## Event Processing

The service consumes events from Kafka topics:

- `order_created` - When a new order is created
- `payment_completed` - When a payment is successfully processed
- `product_viewed` - When a product page is viewed
- `customer_registered` - When a new customer registers

## API Endpoints

### Analytics

- `GET /api/v1/analytics/sales` - Get sales analytics
  - Query params: `startDate`, `endDate`, `productId` (optional)
  
- `GET /api/v1/analytics/revenue` - Get revenue analytics
  - Query params: `startDate`, `endDate`, `periodType` (optional: DAILY, WEEKLY, MONTHLY, YEARLY)
  
- `GET /api/v1/analytics/customer/{customerId}` - Get customer analytics
  - Query params: `startDate`, `endDate`
  
- `GET /api/v1/analytics/product/{productId}` - Get product performance analytics
  - Query params: `startDate`, `endDate`

- `POST /api/v1/analytics/reports/custom` - Generate custom report
  - Body: `{ "type": "sales|revenue|product|customer", "startDate": "2024-01-01", "endDate": "2024-01-31", ... }`

### Health

- `GET /health` - Health check endpoint

## Quick Start

### Prerequisites

- Java 21+
- Maven 3.9+
- PostgreSQL 16+
- Elasticsearch 8.15+
- Apache Kafka 3.0+
- Docker (optional)

### Local Development

1. **Start infrastructure services:**
   ```bash
   docker compose up -d postgres elasticsearch kafka
   ```

2. **Build the project:**
   ```bash
   mvn clean install
   ```

3. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

   Or with a specific profile:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

4. **Run tests:**
   ```bash
   mvn test
   ```

### Docker

1. **From project root, build and start all services:**
   ```bash
   docker compose up -d
   ```

2. **Or build only analytics-service:**
   ```bash
   docker compose build analytics-service
   docker compose up analytics-service
   ```

## Configuration

Key environment variables:

- `PORT` - Server port (default: 3005)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL configuration
- `ELASTICSEARCH_HOST`, `ELASTICSEARCH_PORT` - Elasticsearch configuration
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka bootstrap servers (default: localhost:9092)
- `KAFKA_TOPIC_ORDER_CREATED` - Topic name for order created events
- `KAFKA_TOPIC_PAYMENT_COMPLETED` - Topic name for payment completed events
- `KAFKA_TOPIC_PRODUCT_VIEWED` - Topic name for product viewed events
- `KAFKA_TOPIC_CUSTOMER_REGISTERED` - Topic name for customer registered events
- `SPRING_PROFILES_ACTIVE` - Active profile (dev, prod, test)
- `CORS_ORIGIN` - CORS allowed origins

## Database Schema

### Events Table
- `id` (UUID) - Primary key
- `event_type` (String) - Type of event
- `user_id` (String) - User identifier
- `session_id` (String) - Session identifier
- `entity_id` (String) - Related entity ID
- `entity_type` (String) - Type of entity
- `properties` (TEXT) - JSON event payload
- `timestamp` (Timestamp) - Event timestamp
- `processed` (Boolean) - Processing status
- `processed_at` (Timestamp) - Processing timestamp

### Sales Metrics Table
- `id` (UUID) - Primary key
- `date` (Date) - Metric date
- `product_id` (String) - Product identifier
- `category_id` (String) - Category identifier
- `order_count` (Long) - Number of orders
- `quantity_sold` (Long) - Total quantity sold
- `revenue` (BigDecimal) - Total revenue
- `average_order_value` (BigDecimal) - Average order value

### Customer Metrics Table
- `id` (UUID) - Primary key
- `customer_id` (String) - Customer identifier
- `date` (Date) - Metric date
- `order_count` (Long) - Number of orders
- `total_revenue` (BigDecimal) - Total revenue
- `product_views` (Long) - Number of product views
- `last_order_date` (Date) - Last order date

### Product Performance Table
- `id` (UUID) - Primary key
- `product_id` (String) - Product identifier
- `date` (Date) - Metric date
- `views` (Long) - Total views
- `unique_views` (Long) - Unique viewers
- `orders` (Long) - Number of orders
- `quantity_sold` (Long) - Quantity sold
- `revenue` (BigDecimal) - Revenue
- `conversion_rate` (BigDecimal) - Conversion rate (orders/views)

### Revenue Metrics Table
- `id` (UUID) - Primary key
- `date` (Date) - Metric date
- `period_type` (String) - Period type (DAILY, WEEKLY, MONTHLY, YEARLY)
- `total_revenue` (BigDecimal) - Total revenue
- `order_count` (Long) - Number of orders
- `average_order_value` (BigDecimal) - Average order value
- `refund_amount` (BigDecimal) - Refund amount
- `net_revenue` (BigDecimal) - Net revenue

## Kafka Event Format

### Order Created Event
```json
{
  "order_id": "uuid",
  "customer_id": "uuid",
  "total_amount": 99.99,
  "currency": "USD",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "price": 49.99,
      "category_id": "uuid"
    }
  ],
  "timestamp": "2024-01-01T12:00:00"
}
```

### Payment Completed Event
```json
{
  "payment_id": "uuid",
  "order_id": "uuid",
  "customer_id": "uuid",
  "amount": 99.99,
  "currency": "USD",
  "payment_method": "credit_card",
  "payment_gateway": "stripe",
  "timestamp": "2024-01-01T12:00:00"
}
```

### Product Viewed Event
```json
{
  "product_id": "uuid",
  "user_id": "uuid",
  "session_id": "session-uuid",
  "category_id": "uuid",
  "timestamp": "2024-01-01T12:00:00"
}
```

### Customer Registered Event
```json
{
  "customer_id": "uuid",
  "email": "customer@example.com",
  "registration_source": "web",
  "timestamp": "2024-01-01T12:00:00"
}
```

## Elasticsearch

Events are indexed in Elasticsearch for fast search and analysis:
- Index: `analytics-events`
- Used for real-time queries and advanced analytics

## Architecture

```
src/main/java/com/cloudshop/analyticsservice/
├── consumer/          # Kafka event consumers
├── controller/        # REST controllers
├── service/           # Business logic (analytics, reports)
├── repository/        # Data access layer
│   └── elasticsearch/ # Elasticsearch repositories
├── model/             # JPA entities
│   └── elasticsearch/ # Elasticsearch documents
├── dto/               # Event DTOs
├── config/            # Spring configuration (Kafka, Elasticsearch)
└── exception/         # Exception handling
```

## Best Practices

- ✅ Separation of concerns (Controller → Service → Repository)
- ✅ Real-time event processing with Kafka
- ✅ Dual storage (PostgreSQL for OLTP, Elasticsearch for search)
- ✅ Transaction management for data consistency
- ✅ Comprehensive exception handling
- ✅ Health checks
- ✅ Comprehensive logging
- ✅ Async processing for scalability

## Performance Considerations

- Events are processed asynchronously
- Metrics are aggregated daily to reduce storage
- Elasticsearch is used for fast querying of events
- Consider batch processing for high-volume scenarios

## License

Part of the CloudShop project.

