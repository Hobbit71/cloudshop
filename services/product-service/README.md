# CloudShop Product Service

Production-ready Product Service for CloudShop built with Spring Boot 3.2, PostgreSQL, Elasticsearch, and Redis.

## Features

- ✅ RESTful API for product management
- ✅ Full-text search with Elasticsearch
- ✅ Redis caching for performance
- ✅ Product variants (size, color, SKU)
- ✅ Rating and reviews
- ✅ Category management
- ✅ Bulk import via CSV
- ✅ Image upload support
- ✅ Pagination and sorting
- ✅ Comprehensive filtering
- ✅ Health checks and monitoring
- ✅ Docker support
- ✅ Comprehensive test coverage

## API Endpoints

### Products

- `GET /api/v1/products` - List products with pagination
- `GET /api/v1/products/{id}` - Get product details
- `POST /api/v1/products` - Create product (requires X-Merchant-Id header)
- `PUT /api/v1/products/{id}` - Update product (requires X-Merchant-Id header)
- `DELETE /api/v1/products/{id}` - Soft delete product (requires X-Merchant-Id header)
- `GET /api/v1/products/search` - Full-text search with filters
- `GET /api/v1/products/category/{categoryId}` - Get products by category
- `GET /api/v1/products/merchant/{merchantId}` - Get products by merchant
- `POST /api/v1/products/bulk-import` - Bulk import products from CSV
- `POST /api/v1/products/{id}/images` - Upload product images

### Categories

- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/{id}` - Get category by ID
- `GET /api/v1/categories/slug/{slug}` - Get category by slug
- `GET /api/v1/categories/parent/{parentId}` - Get subcategories

### Health

- `GET /health` - Health check endpoint

## Quick Start

### Prerequisites

- Java 21+
- Maven 3.9+
- PostgreSQL 16+
- Redis 7+
- Elasticsearch 8.15+
- Docker (optional)

### Local Development

1. **Start infrastructure services:**
   ```bash
   docker compose up -d postgres redis elasticsearch
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

2. **Or build only product-service:**
   ```bash
   docker compose build product-service
   docker compose up product-service
   ```

## Configuration

Key environment variables:

- `PORT` - Server port (default: 3002)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `ELASTICSEARCH_HOST`, `ELASTICSEARCH_PORT` - Elasticsearch configuration
- `SPRING_PROFILES_ACTIVE` - Active profile (dev, prod, test)
- `CORS_ORIGIN` - CORS allowed origins

## Database Schema

### Product Entity
- `id` (UUID) - Primary key
- `merchantId` (UUID) - Merchant identifier
- `name` (String) - Product name
- `description` (Text) - Product description
- `sku` (String, unique) - Stock keeping unit
- `price` (BigDecimal) - Product price
- `categoryId` (UUID) - Category reference
- `imageUrl` (String) - Primary image URL
- `imageUrls` (List<String>) - Additional image URLs
- `variants` (List<ProductVariant>) - Product variants
- `reviews` (List<Review>) - Product reviews
- `isActive` (Boolean) - Active status
- `createdAt`, `updatedAt` (Timestamp) - Audit fields

## Caching

The service uses Redis for caching with the following cache keys:
- `product` - Individual product cache (TTL: 3600s)
- `products` - Product list cache (TTL: 3600s)
- `category` - Individual category cache (TTL: 7200s)
- `categories` - Category list cache (TTL: 7200s)

## Search

Full-text search is powered by Elasticsearch with fallback to database queries. Search supports:
- Text search (name, description, SKU)
- Category filtering
- Price range filtering
- Rating filtering
- Merchant filtering
- Active status filtering

## Bulk Import

CSV format for bulk import:
```csv
name,description,sku,price,categoryId,imageUrl
Product Name,Product Description,SKU-001,99.99,uuid-category-id,https://example.com/image.jpg
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

## Architecture

```
src/main/java/com/cloudshop/productservice/
├── controller/          # REST controllers
├── service/            # Business logic
├── repository/          # Data access layer
│   └── elasticsearch/  # Elasticsearch repositories
├── model/               # JPA entities
│   └── elasticsearch/   # Elasticsearch documents
├── dto/                 # Data transfer objects
├── config/              # Spring configuration
└── exception/           # Custom exceptions
```

## Best Practices

- ✅ Separation of concerns (Controller → Service → Repository)
- ✅ DTOs for request/response mapping
- ✅ MapStruct for efficient entity mapping
- ✅ Comprehensive validation
- ✅ Global exception handling
- ✅ Soft deletes for products
- ✅ Transaction management
- ✅ Caching strategies
- ✅ Health checks
- ✅ Comprehensive logging

## License

Part of the CloudShop project.

