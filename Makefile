# CloudShop root Makefile
# Targets provide a consistent developer experience across polyglot services.

.PHONY: setup dev test build deploy-local clean help

SHELL := /bin/bash
PROJECT_NAME := cloudshop

help:
	@echo "Common targets:"
	@echo "  setup         One-time setup (env file, preflight checks)"
	@echo "  dev           Start local infra (docker compose up -d)"
	@echo "  test          Run monorepo tests (placeholder; customize per service)"
	@echo "  build         Build all images (docker compose build)"
	@echo "  deploy-local  Alias for dev; customize for k8s later"
	@echo "  clean         Stop and remove local infra (down -v)"

setup:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example"; else echo ".env already exists"; fi
	@command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
	@command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required"; exit 1; }

dev:
	@echo "Starting local infra..."
	@docker compose up -d
	@echo "Infra started. Check health: postgres:5432, redis:6379, elastic:9200, wiremock:8080"

test:
	@echo "Running monorepo tests (placeholder). Customize to iterate services."
	@# Example: find services/* -maxdepth 1 -type d -exec make -C {} test \;

build:
	@echo "Building docker images..."
	@docker compose build --pull

deploy-local: dev

clean:
	@echo "Stopping and removing local infra..."
	@docker compose down -v --remove-orphans

