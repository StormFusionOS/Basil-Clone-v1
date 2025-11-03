# BookForge POS Monorepo

BookForge POS is a production-ready point of sale platform that powers in-store and online transactions for modern booksellers. This monorepo uses pnpm workspaces to manage desktop, web, API, worker, and shared packages.

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Launch the full development stack:

   ```bash
   make up
   ```

The `make up` command builds the Docker images and starts PostgreSQL, RabbitMQ, MinIO, API, workers, Electron POS, and the observability stack (Nginx, Prometheus, Grafana, Loki).

## Available Make Targets

- `make dev` – run local development processes with hot reload.
- `make test` – execute all unit and integration tests.
- `make build` – build production bundles for all applications.
- `make up` – build and start the docker-compose development stack.
- `make down` – stop and remove docker-compose services.
- `make seed` – seed local development data via the API.

## Repository Layout

```
apps/
  api/          # NestJS API service
  pos-app/      # Electron + React POS application
  workers/      # Background workers and schedulers
packages/
  clients/      # API connectors and SDKs
  domain/       # Shared domain types and zod schemas
  ui/           # Shared UI kit based on MUI
```
