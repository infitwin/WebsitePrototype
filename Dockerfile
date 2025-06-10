FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    OTEL_SERVICE_NAME=website-prototype \
    OTEL_SERVICE_VERSION=1.0.0 \
    OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector-service-833139648849.us-central1.run.app \
    OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
    OTEL_LOG_LEVEL=info

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start application
CMD ["node", "server.js"]