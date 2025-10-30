# CloudShop Makefile

.PHONY: help setup dev test build deploy-local clean

SHELL := /bin/bash
DOCKER_COMPOSE := docker compose
ENV_FILE := .env

help:
	@echo "CloudShop Makefile targets:"
	@echo "  setup         Install tooling, prepare local environment"
	@echo "  dev           Start local infra (Postgres, Redis, Elasticsearch, Mock Payment)"
	@echo "  test          Run repository tests (placeholder until services are added)"
	@echo "  build         Build all containers"
	@echo "  deploy-local  Bring up infra and (future) microservices"
	@echo "  clean         Stop and remove containers, networks, volumes"

setup:
	@echo "[setup] Preparing local environment..."
	@if [ ! -f $(ENV_FILE) ]; then cp .env.example $(ENV_FILE); echo "Created $(ENV_FILE) from .env.example"; fi
	@echo "[setup] Done. You can now run 'make dev'"

dev:
	@echo "[dev] Starting local dependencies via docker-compose..."
	$(DOCKER_COMPOSE) --env-file $(ENV_FILE) up -d
	@echo "[dev] Services starting. Use 'docker compose ps' to view status."

test:
	@echo "[test] Running tests (placeholder). Add service-level tests as they are introduced."
	@echo "[test] No tests defined yet."

build:
	@echo "[build] Building containers..."
	$(DOCKER_COMPOSE) --env-file $(ENV_FILE) build --pull

deploy-local: dev
	@echo "[deploy-local] Infra is up. Add microservice compose profiles or k8s manifests later."

clean:
	@echo "[clean] Stopping and removing containers, networks, and volumes..."
	$(DOCKER_COMPOSE) --env-file $(ENV_FILE) down -v --remove-orphans
	@echo "[clean] Done."


