SHELL := /bin/bash

.PHONY: dev test build up down seed install

install:
pnpm install

dev:
pnpm install --frozen-lockfile --ignore-scripts && pnpm --parallel --filter ./apps... dev

test:
pnpm test

build:
pnpm build

up:
docker compose up --build -d

stop:
docker compose stop

down:
docker compose down --remove-orphans

seed:
pnpm --filter @bookforge/api exec ts-node ./scripts/seed.ts
