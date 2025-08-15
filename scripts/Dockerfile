# C/No Voidline - Production Docker Image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV VITE_REQUIRE_AUTH=false
ENV VITE_DEPLOYMENT_TARGET=docker

# Build application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 cno-voidline

# Copy built application
COPY --from=builder --chown=cno-voidline:nodejs /app/dist ./dist
COPY --from=builder --chown=cno-voidline:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cno-voidline:nodejs /app/package.json ./package.json

# Copy additional files
COPY --from=builder --chown=cno-voidline:nodejs /app/attached_assets ./attached_assets
COPY --from=builder --chown=cno-voidline:nodejs /app/config.html ./config.html

# Switch to non-root user
USER cno-voidline

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "run", "start"]