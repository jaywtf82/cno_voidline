# C/No Voidline - Production Docker Image
# Multi-stage build for optimized deployment

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Build application
RUN npm run build

# Runtime stage
FROM node:18-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S voidline -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=voidline:nodejs /app/dist ./dist/
COPY --from=builder --chown=voidline:nodejs /app/node_modules ./node_modules/
COPY --from=builder --chown=voidline:nodejs /app/package*.json ./

# Copy production files
COPY --chown=voidline:nodejs public/ ./public/
COPY --chown=voidline:nodejs scripts/quick-start.sh ./scripts/
RUN chmod +x ./scripts/quick-start.sh

# Create data directory
RUN mkdir -p /app/data && chown voidline:nodejs /app/data

# Switch to non-root user
USER voidline

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server/index.js"]