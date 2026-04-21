# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.33.0

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY test/package.json ./test/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend/ ./backend/

# Build TypeScript
RUN pnpm --filter rural-talent-system-backend build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.33.0

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY test/package.json ./test/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/backend/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8083/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "dist/app.js"]
