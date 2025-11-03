# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/workers/package.json ./apps/workers/
RUN pnpm install --filter @bookforge/workers... --prod --no-hoist

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @bookforge/workers build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/workers/dist ./dist
COPY apps/workers/package.json ./
CMD ["node", "dist/index.js"]
