# =============================================================================
# Multi-stage Dockerfile for Clinic SaaS Application
# =============================================================================
# This Dockerfile creates an optimized production image using Next.js standalone output
# Build time: ~5-10 minutes
# Final image size: ~500MB
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:18-alpine AS deps

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files from monorepo root
COPY package.json package-lock.json ./
COPY apps/clinic/package.json ./apps/clinic/

# Install dependencies
RUN npm ci --only=production

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/clinic/node_modules ./apps/clinic/node_modules

# Copy source code
COPY apps/clinic ./apps/clinic
COPY package.json package-lock.json ./

# Set environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
WORKDIR /app/apps/clinic
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Runner
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata

# Create app user (non-root for security)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Set timezone (adjust as needed)
ENV TZ=UTC

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/clinic/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/clinic/.next/static ./apps/clinic/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/clinic/public ./apps/clinic/public

# Copy additional runtime files
COPY --from=builder --chown=nextjs:nodejs /app/apps/clinic/lib/run-self-polyfill.cjs ./apps/clinic/lib/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5053
ENV HOSTNAME=0.0.0.0

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5053

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5053/api/health || exit 1

# Start application with dumb-init (proper signal handling)
CMD ["dumb-init", "node", "apps/clinic/server.js"]
