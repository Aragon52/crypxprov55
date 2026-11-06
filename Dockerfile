# Multi-stage Dockerfile for Google Cloud Run Deployment
# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled build artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.sql ./schema.sql
COPY --from=builder /app/setup_admin_auth.sql ./setup_admin_auth.sql
COPY --from=builder /app/public ./public

EXPOSE 3000

# Start Express production server
CMD ["node", "dist/server.cjs"]
