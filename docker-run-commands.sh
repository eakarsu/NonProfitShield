#!/bin/bash

# Docker run commands for Insurance Platform deployment
# Make sure to set your OPENROUTER_API_KEY before running

# Create a Docker network for the containers to communicate
echo "Creating Docker network..."
docker network create insurance-network

# Start PostgreSQL database
echo "Starting PostgreSQL database..."
docker run -d \
  --name insurance-postgres \
  --network insurance-network \
  -e POSTGRES_DB=insurance_platform \
  -e POSTGRES_USER=insurance_user \
  -e POSTGRES_PASSWORD=insurance_password \
  -v postgres_data:/var/lib/postgresql/data \
  -v "$(pwd)/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql" \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:15-alpine

# Wait for PostgreSQL to be ready
echo "Waiting for database to be ready..."
sleep 10

# Build the application image
echo "Building application image..."
docker build -t insurance-platform .

# Start the application
echo "Starting insurance platform application..."
docker run -d \
  --name insurance-app \
  --network insurance-network \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://insurance_user:insurance_password@insurance-postgres:5432/insurance_platform \
  -e PGHOST=insurance-postgres \
  -e PGPORT=5432 \
  -e PGUSER=insurance_user \
  -e PGPASSWORD=insurance_password \
  -e PGDATABASE=insurance_platform \
  -e SESSION_SECRET=your-secure-session-secret-change-this-in-production \
  -e REPL_ID=insurance-platform \
  -e REPLIT_DOMAINS=localhost,127.0.0.1 \
  -e ISSUER_URL=https://replit.com/oidc \
  -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
  -e PORT=5000 \
  -e HOST=0.0.0.0 \
  -v uploads:/app/uploads \
  --restart unless-stopped \
  insurance-platform

echo "Insurance platform is starting..."
echo "Application will be available at http://localhost:5000"
echo "Database accessible at localhost:5432"

# Check status
echo "Checking container status..."
docker ps --filter "name=insurance-"