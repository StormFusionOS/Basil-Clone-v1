# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/pos-app/package.json ./apps/pos-app/
RUN pnpm install --filter @bookforge/pos-app... --prod --no-hoist
COPY . .
RUN pnpm --filter @bookforge/pos-app build

FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/apps/pos-app/dist/web ./
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
