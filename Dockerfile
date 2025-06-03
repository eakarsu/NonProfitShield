FROM node:20-alpine

# Install PostgreSQL and necessary dependencies
RUN apk add --no-cache postgresql postgresql-contrib curl

# Create postgres user and data directory (if not exists)
RUN id postgres || adduser -D -s /bin/sh postgres
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql
RUN chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql

# Set up application
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=postgresql://postgres:password@localhost:5432/insurance_platform
ENV PGHOST=localhost
ENV PGPORT=5432
ENV PGUSER=postgres
ENV PGPASSWORD=password
ENV PGDATABASE=insurance_platform
ENV SESSION_SECRET=change-this-secure-session-secret-in-production
ENV REPL_ID=insurance-platform
ENV REPLIT_DOMAINS=localhost

# Copy database initialization script
COPY init-db.sql /docker-entrypoint-initdb.d/

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo '# Initialize PostgreSQL' >> /app/start.sh && \
    echo 'su postgres -c "initdb -D /var/lib/postgresql/data"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start PostgreSQL' >> /app/start.sh && \
    echo 'su postgres -c "postgres -D /var/lib/postgresql/data" &' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for PostgreSQL to start' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Create database and user' >> /app/start.sh && \
    echo 'su postgres -c "createdb insurance_platform"' >> /app/start.sh && \
    echo 'su postgres -c "psql -d insurance_platform -f /docker-entrypoint-initdb.d/init-db.sql"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start the Node.js application' >> /app/start.sh && \
    echo 'exec node dist/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start both PostgreSQL and the application
CMD ["/app/start.sh"]