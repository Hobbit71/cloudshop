.PHONY: build run test migrate-up migrate-down clean docker-build docker-run

# Build the application
build:
	go build -o payment-service ./main.go

# Run the application
run:
	go run main.go

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Run migrations up
migrate-up:
	migrate -path migrations -database "$$DATABASE_URL" up

# Run migrations down
migrate-down:
	migrate -path migrations -database "$$DATABASE_URL" down 1

# Clean build artifacts
clean:
	rm -f payment-service coverage.out coverage.html

# Build Docker image
docker-build:
	docker build -t payment-service .

# Run Docker container
docker-run:
	docker run -p 8081:8081 --env-file .env payment-service

# Install dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

