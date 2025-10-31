Contributing to CloudShop
=========================

Thank you for your interest in contributing! This document outlines how to propose changes, the standards we follow, and how to get your work reviewed and merged.

Ground rules
------------

- Be respectful and inclusive. See `CODE_OF_CONDUCT.md`.
- Favor small, incremental pull requests over large changes.
- Write tests for new behavior and keep coverage from regressing.
- Document user-facing changes in `README.md` and add entries to `CHANGELOG.md`.

Getting started
---------------

1. Fork and clone the repository.
2. Create a local `.env` from `.env.example` and start local infra:
   ```bash
   cp .env.example .env
   make dev
   ```
3. Use the Dev Container for a consistent toolchain or ensure you have Node.js 20, Python 3.11, Java 17, and Go 1.22 installed.

Issue workflow
--------------

- Search existing issues and discussions before opening a new one.
- When filing a bug, include steps to reproduce, expected behavior, and logs.
- Label issues appropriately (bug, feature, documentation, good first issue).

Branching model
---------------

- `main` is protected; it always reflects the latest stable state.
- Create feature branches from `main` using the format: `feat/<area>-<short-description>` (e.g., `feat/catalog-bulk-import`).
- For fixes, use: `fix/<area>-<short-description>`.

Commit messages
---------------

We follow Conventional Commits:

```
<type>(optional scope): <description>

[optional body]
[optional footer(s)]
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`, `ci`.

Code standards
--------------

This is a polyglot monorepo. Each service contains its own tooling, but we aim for consistency.

- Node.js
  - Node 20.x, TypeScript preferred for new services
  - Lint with ESLint, format with Prettier
  - Test with Jest/Vitest (or framework-specific)
  - `npm ci` for reproducible installs

- Python
  - Python 3.11
  - Lint with Ruff, format with Black
  - Test with Pytest

- Java
  - Java 17
  - Build with Maven or Gradle
  - Use JUnit 5 for testing

- Go
  - Go 1.22
  - `go fmt`, `go vet`, and `staticcheck`
  - Test with `go test ./...`

Pull requests
-------------

1. Ensure your branch is up-to-date with `main` and rebased if necessary.
2. Run tests and linters for your service(s) and ensure CI passes.
3. Update docs and examples.
4. Add a `CHANGELOG.md` entry under "Unreleased".
5. Request review from relevant code owners/maintainers.

Review guidelines
-----------------

- Prefer direct, actionable feedback.
- Focus on correctness, readability, performance, and security.
- Ensure tests cover the change, including edge cases.

Release notes and changelog
---------------------------

- We maintain `CHANGELOG.md` per Keep a Changelog and Semantic Versioning.
- Group changes under Added, Changed, Deprecated, Removed, Fixed, Security.

Security
--------

- Do not open public issues for security vulnerabilities. Instead, follow the process in `SECURITY.md` if present or contact the maintainers privately.

Local troubleshooting
---------------------

- Restart infra: `make clean && make dev`.
- Check health:
  - PostgreSQL: `psql -h localhost -U cloudshop -d cloudshop -c "select 1"`
  - Redis: `redis-cli -h localhost ping`
  - Elasticsearch: `curl http://localhost:9200`
  - Payment mock: `curl http://localhost:8080/__admin/mappings`
# Contributing to CloudShop

Thank you for your interest in contributing! This doc covers how to propose changes and keep quality high across a polyglot microservices codebase.

## Code of Conduct
By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to Contribute
- Report bugs and issues
- Propose features or improvements
- Improve documentation
- Add tests, refactor code, improve reliability

## Development Setup
1. Install prerequisites: Docker, Docker Compose, Make.
2. Copy environment: `cp .env.example .env` and adjust values.
3. Start local infra: `make dev`.
4. Use the Dev Container for a consistent toolchain.

## Branching Model
- Main: always releasable
- Features: `feat/<short-description>`
- Fixes: `fix/<short-description>`
- Chores: `chore/<short-description>`

## Commit Messages (Conventional Commits)
- `feat: add cart item reservation`
- `fix: resolve redis connection leak`
- `docs: update quick start`
- `chore: bump devcontainer features`

## Pull Request Checklist
- Motivation and context
- What changed
- How it was tested
- Breaking changes / migrations

## Coding Standards
- Optimize for clarity and readability
- Node.js: ESLint + Prettier
- Python: Ruff; black-equivalent formatting via pyproject
- Java: Google Java Style; static analysis where applicable
- Go: gofmt, go vet, and staticcheck

## Testing
- Unit tests for critical logic
- Integration tests for DB/cache/search/external services
- Use WireMock mappings for payment gateway when needed

## Security
- Never commit real secrets; use env vars/secret managers
- Validate inputs; enforce authz/authn; avoid logging sensitive data

## Release & Changelog
- Semantic Versioning
- Update [CHANGELOG.md](CHANGELOG.md) under Unreleased; maintainers bump versions on release

## Issue Labels
- `bug`, `enhancement`, `documentation`, `good first issue`

Thanks for helping improve CloudShop!
