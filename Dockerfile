FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/

# Copy license and readme
COPY LICENSE README.md ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change to non-root user
USER nodejs

# Expose port for SSE transport (default 3000)
EXPOSE 3000

# Default command runs with stdio transport
CMD ["node", "dist/index.js"]

# For testing help command in docker
ENTRYPOINT ["node", "dist/index.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')"