# CloudShop Customer Service

Production-ready Customer Service for CloudShop built with Spring Boot, PostgreSQL, and Elasticsearch.

## Features

- ✅ Customer profile management
- ✅ Address book management (multiple addresses per customer)
- ✅ Customer preferences (language, currency, communication settings)
- ✅ Loyalty program tracking (points, tiers, lifetime value)
- ✅ Communication preferences (email, SMS, push notifications)
- ✅ Customer lifecycle management (NEW, ACTIVE, AT_RISK, CHURNED, WIN_BACK)
- ✅ Elasticsearch integration for customer search
- ✅ Redis caching for performance
- ✅ Comprehensive validation and error handling
- ✅ Health checks

## Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL
- **Search**: Elasticsearch 8.15.2
- **Cache**: Redis
- **Mapping**: MapStruct
- **Build Tool**: Maven

## API Endpoints

### Customer Management

- `GET /api/v1/customers/{id}` - Get customer by ID
- `PUT /api/v1/customers/{id}` - Update customer profile

### Address Management

- `POST /api/v1/customers/{id}/addresses` - Create new address
- `GET /api/v1/customers/{id}/addresses` - Get all addresses for customer

### Customer Orders

- `GET /api/v1/customers/{id}/orders` - Get customer orders (integrates with order-service)

### Preferences

- `GET /api/v1/customers/{id}/preferences` - Get customer preferences
- `PUT /api/v1/customers/{id}/preferences` - Update customer preferences

### Loyalty Program

- `GET /api/v1/customers/{id}/loyalty` - Get loyalty program details

## Project Structure

```
customer-service/
├── src/main/java/com/cloudshop/customerservice/
│   ├── config/              # Spring configuration
│   │   ├── CacheConfig.java
│   │   ├── CorsConfig.java
│   │   └── ElasticsearchConfig.java
│   ├── controller/          # REST controllers
│   │   ├── CustomerController.java
│   │   └── HealthController.java
│   ├── dto/                 # Data transfer objects
│   │   ├── AddressRequest.java
│   │   ├── AddressResponse.java
│   │   ├── CustomerRequest.java
│   │   ├── CustomerResponse.java
│   │   ├── LoyaltyResponse.java
│   │   ├── PageResponse.java
│   │   ├── PreferencesRequest.java
│   │   └── PreferencesResponse.java
│   ├── exception/           # Exception handling
│   │   ├── ErrorResponse.java
│   │   ├── GlobalExceptionHandler.java
│   │   └── ResourceNotFoundException.java
│   ├── model/               # JPA entities
│   │   ├── Address.java
│   │   ├── Customer.java
│   │   ├── CustomerPreferences.java
│   │   ├── LoyaltyProgram.java
│   │   └── elasticsearch/
│   │       └── CustomerDocument.java
│   ├── repository/          # Data access layer
│   │   ├── AddressRepository.java
│   │   ├── CustomerPreferencesRepository.java
│   │   ├── CustomerRepository.java
│   │   ├── LoyaltyProgramRepository.java
│   │   └── elasticsearch/
│   │       └── CustomerSearchRepository.java
│   └── service/             # Business logic
│       ├── AddressService.java
│       ├── CustomerMapper.java
│       ├── CustomerService.java
│       ├── LoyaltyService.java
│       └── PreferencesService.java
└── src/main/resources/
    └── application.yml       # Application configuration
```

## Database Schema

### Customers Table

- Customer profile information
- Status tracking (ACTIVE, INACTIVE, SUSPENDED, CLOSED)
- Lifecycle stage (NEW, ACTIVE, AT_RISK, CHURNED, WIN_BACK)

### Customer Addresses Table

- Multiple addresses per customer
- Support for billing and shipping addresses
- Default address designation

### Customer Preferences Table

- Language, currency, timezone
- Communication preferences (email, SMS, push)
- Marketing opt-ins/opt-outs
- Custom preferences (JSON)

### Loyalty Programs Table

- Points balance and lifetime points
- Tier status (BRONZE, SILVER, GOLD, PLATINUM)
- Total spent and order count
- Points expiration tracking

## Configuration

### Environment Variables

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: cloudshop)
- `DB_USER` - Database user (default: cloudshop)
- `DB_PASSWORD` - Database password (default: cloudshop)
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `ELASTICSEARCH_HOST` - Elasticsearch host (default: localhost)
- `ELASTICSEARCH_PORT` - Elasticsearch port (default: 9200)
- `PORT` - Service port (default: 3004)
- `CORS_ORIGIN` - Allowed CORS origins

## Running the Service

### Using Docker Compose

```bash
docker-compose up customer-service
```

### Local Development

```bash
mvn spring-boot:run
```

## Testing

### Unit Tests

```bash
mvn test
```

### Integration Tests

Integration tests use TestContainers for PostgreSQL and Elasticsearch:

```bash
mvn verify
```

## Best Practices

- ✅ Separation of concerns (Controller → Service → Repository)
- ✅ DTOs for request/response mapping
- ✅ MapStruct for efficient entity mapping
- ✅ Comprehensive validation
- ✅ Global exception handling
- ✅ Transaction management
- ✅ Caching strategies
- ✅ Health checks
- ✅ Comprehensive logging

## License

Part of the CloudShop project.

