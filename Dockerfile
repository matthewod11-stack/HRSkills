# ============================================
# HR Command Center - Production Dockerfile
# ============================================
# Multi-stage build for optimized Next.js deployment
# Base image: Node.js 20 Alpine (minimal, secure)
# Final image size target: <200MB

# ============================================
# Stage 1: Dependencies Installation
# ============================================
FROM node:20-alpine AS deps

# Install libc6-compat for compatibility with some npm packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files from root and webapp
COPY package.json package-lock.json* ./
COPY webapp/package.json webapp/package-lock.json* ./webapp/

# Install dependencies with clean cache
# Using ci for reproducible builds
RUN npm ci --workspace=webapp --legacy-peer-deps && \
    npm cache clean --force

# ============================================
# Stage 2: Build Application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/webapp/node_modules ./webapp/node_modules

# Copy application source
COPY . .

# Set production environment for optimal build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
WORKDIR /app/webapp
RUN npm run build

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:20-alpine AS runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/webapp/public ./webapp/public

# Set proper permissions for prerender cache
RUN mkdir -p ./webapp/.next && \
    chown nextjs:nodejs ./webapp/.next

# Copy built application with ownership
COPY --from=builder --chown=nextjs:nodejs /app/webapp/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/webapp/.next/static ./webapp/.next/static

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "webapp/server.js"]
