# Single-service image: builds the client bundle and serves it from the API
# server, so one Railway deploy exposes the whole game on one URL.

# ---- Build stage: compile the client bundle ----
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install
COPY shared/ ./shared/
COPY client/ ./client/
RUN npm run build -w client

# ---- Runtime stage: API server + built client ----
FROM node:20-slim AS runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY server/package.json ./server/

RUN npm install --workspace=server --include-workspace-root

COPY server/ ./server/

RUN npx prisma generate --schema=./server/prisma/schema.prisma

# Built static client from the build stage (served at the same origin).
COPY --from=build /app/client/dist ./client/dist

EXPOSE 3001

CMD npx prisma migrate deploy --schema=./server/prisma/schema.prisma && npm run start -w server
