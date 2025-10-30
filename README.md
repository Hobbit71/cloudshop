CloudShop
=========

CloudShop is a cloud-native e-commerce platform designed as a polyglot, microservices-oriented monorepo. It provides a modern foundation for building scalable online stores with best practices for local development, CI/CD, observability, and production readiness.

Key characteristics:
- Polyglot services (Node.js, Python, Java, Go)
- Microservice-first, API-driven architecture
- PostgreSQL for transactional data, Redis for caching/queues, Elasticsearch for search
- Modular service onboarding with consistent tooling and environments

Status: This repository contains the core developer experience, infra for local dev, and contribution scaffolding. Individual microservices are added separately.

Quick start
-----------

Prerequisites:
- Docker Desktop 4.x+
- Make (GNU make)
- Optional: VS Code with Dev Containers extension

Steps:
1. Copy the example environment file and adjust as needed:
   ```bash
   cp .env.example .env
   ```
2. Start local infrastructure (databases, cache, search, mock gateway):
   ```bash
   make dev
   ```
3. Verify services are healthy:
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379
   - Elasticsearch: http://localhost:9200
   - Mock payment gateway (WireMock): http://localhost:8080/__admin

Common commands
---------------

```bash
# One-time setup helpers
make setup

# Start/stop local infra
make dev       # up -d
make clean     # down -v

# Build and test (monorepo-wide placeholders, customize per service)
make build
make test

# Deploy locally (alias of dev; customize for k8s or kind/minikube later)
make deploy-local
```

Architecture
------------

```mermaid
flowchart LR
  subgraph Clients
    U[Web/Mobile]
  end

  U --> AG[API Gateway]

  subgraph Microservices
    direction LR
    AUTH[Auth Service]
    CATALOG[Catalog Service]
    CART[Cart Service]
    ORDER[Order Service]
    PAYMENT[Payment Service (uses Mock in dev)]
    INVENTORY[Inventory Service]
    NOTIFY[Notification Service]
  end

  AG --> AUTH
  AG --> CATALOG
  AG --> CART
  AG --> ORDER
  ORDER --> PAYMENT
  ORDER --> INVENTORY
  NOTIFY --> U

  subgraph Data
    direction LR
    PG[(PostgreSQL)]
    REDIS[(Redis)]
    ES[(Elasticsearch)]
  end

  AUTH --> PG
  CATALOG --> PG
  CART --> REDIS
  ORDER --> PG
  INVENTORY --> PG
  CATALOG --> ES
```

Repository layout (planned)
---------------------------

```
/services
  /gateway              # API gateway / BFF
  /auth                 # Authentication & sessions
  /catalog              # Products, categories, attributes
  /cart                 # Cart operations
  /order                # Orders & checkout
  /inventory            # Stock, reservations
  /payment              # Payment integration (mocks locally)
  /notification         # Email/SMS/webhook
/libs                   # Shared libraries, contracts, SDKs
/infra                  # Local infra helpers (mappings, scripts)
```

Development environment
-----------------------

- Dev Container: See `.devcontainer/devcontainer.json` for a polyglot toolchain.
- Local infra: `docker-compose.yml` provisions PostgreSQL, Redis, Elasticsearch, and a mock payment gateway (WireMock).
- Environments: Use `.env` at repo root for shared defaults; services may also have their own env files.

Security and secrets
--------------------

- Do not commit secrets. Use `.env` locally and secret managers in higher environments.
- Rotate secrets regularly; prefer short TTLs for tokens.
- Ensure JWT signing keys and database credentials are unique per environment.

Contributing and governance
---------------------------

- Read `CONTRIBUTING.md` for the workflow, commit conventions, and code review expectations.
- See `CODE_OF_CONDUCT.md` for community standards.
- Changes should be recorded in `CHANGELOG.md` per Keep a Changelog.

License
-------

This project is licensed under the terms of the `LICENSE` file.
# CloudShop
CloudShop is a modern, cloud-native e-commerce platform designed to showcase best-in-class DevSecOps practices using containerized n-tier architecture. This application demonstrates the complete software delivery lifecycle, including continuous integration, continuous delivery, infrastructure provisioning, security testing, feature management, and cloud cost optimization - all capabilities that align with the Harness platform’s comprehensive approach to modern software delivery.

The application serves as an ideal reference implementation for organizations seeking to accelerate innovation velocity, drive continuous quality and resilience, secure and govern software delivery, and optimize cloud costs and engineering processes
