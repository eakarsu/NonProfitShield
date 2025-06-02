#!/bin/bash

# Simple deployment script for Insurance Platform
# Usage: ./deploy.sh

set -e

echo "=== Insurance Platform Deployment ==="

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ Error: OPENROUTER_API_KEY environment variable is not set"
    echo "Please export your OpenRouter API key:"
    echo "export OPENROUTER_API_KEY=your-api-key-here"
    exit 1
fi

echo "✅ OpenRouter API key found"

# Create network if it doesn't exist
if ! docker network ls | grep -q insurance-network; then
    echo "📡 Creating Docker network..."
    docker network create insurance-network
else
    echo "📡 Docker network already exists"
fi

# Create volume for database persistence
if ! docker volume ls | grep -q postgres_data; then
    echo "💾 Creating database volume..."
    docker volume create postgres_data
else
    echo "💾 Database volume already exists"
fi

# Stop and remove existing containers if they exist
echo "🧹 Cleaning up existing containers..."
docker stop insurance-app insurance-postgres 2>/dev/null || true
docker rm insurance-app insurance-postgres 2>/dev/null || true

# Start PostgreSQL
echo "🗄️  Starting PostgreSQL database..."
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

# Wait for database to be ready
echo "⏳ Waiting for database to initialize..."
sleep 15

# Check database health
echo "🔍 Checking database connection..."
until docker exec insurance-postgres pg_isready -U insurance_user -d insurance_platform; do
    echo "Database not ready yet, waiting..."
    sleep 2
done
echo "✅ Database is ready"

# Build application image
echo "🔨 Building application image..."
docker build -t insurance-platform .

# Start application
echo "🚀 Starting insurance application..."
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
  -e OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
  -e PORT=5000 \
  -e HOST=0.0.0.0 \
  --restart unless-stopped \
  insurance-platform

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Check application health
echo "🔍 Checking application health..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "⚠️  Application may still be starting..."
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker ps --filter "name=insurance-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎉 Deployment Complete!"
echo "📱 Application: http://localhost:5000"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "  View logs: docker logs insurance-app"
echo "  Stop all:  docker stop insurance-app insurance-postgres"
echo "  Restart:   docker restart insurance-app"