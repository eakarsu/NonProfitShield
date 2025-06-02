#!/bin/bash

# Insurance Platform Management Script
# Usage: ./manage.sh [start|stop|restart|logs|status|clean]

case "$1" in
    start)
        echo "Starting Insurance Platform..."
        
        # Check if OPENROUTER_API_KEY is set
        if [ -z "$OPENROUTER_API_KEY" ]; then
            echo "Error: OPENROUTER_API_KEY not set. Please run:"
            echo "export OPENROUTER_API_KEY=your-api-key"
            exit 1
        fi
        
        # Create network
        docker network create insurance-network 2>/dev/null || true
        
        # Start database
        docker run -d \
          --name insurance-postgres \
          --network insurance-network \
          -e POSTGRES_DB=insurance_platform \
          -e POSTGRES_USER=insurance_user \
          -e POSTGRES_PASSWORD=insurance_password \
          -v postgres_data:/var/lib/postgresql/data \
          -v "$(pwd)/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql" \
          -p 5432:5432 \
          postgres:15-alpine
        
        sleep 10
        
        # Build and start app
        docker build -t insurance-platform .
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
          -e SESSION_SECRET=change-this-secure-session-secret \
          -e REPL_ID=insurance-platform \
          -e REPLIT_DOMAINS=localhost \
          -e OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
          insurance-platform
        
        echo "Platform started. Access at http://localhost:5000"
        ;;
        
    stop)
        echo "Stopping Insurance Platform..."
        docker stop insurance-app insurance-postgres 2>/dev/null || true
        ;;
        
    restart)
        $0 stop
        sleep 3
        $0 start
        ;;
        
    logs)
        if [ "$2" = "db" ]; then
            docker logs -f insurance-postgres
        else
            docker logs -f insurance-app
        fi
        ;;
        
    status)
        echo "Container Status:"
        docker ps --filter "name=insurance-"
        ;;
        
    clean)
        echo "Cleaning up containers and volumes..."
        docker stop insurance-app insurance-postgres 2>/dev/null || true
        docker rm insurance-app insurance-postgres 2>/dev/null || true
        docker volume rm postgres_data 2>/dev/null || true
        docker network rm insurance-network 2>/dev/null || true
        echo "Cleanup complete"
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the platform"
        echo "  stop    - Stop all containers"
        echo "  restart - Restart the platform"
        echo "  logs    - View app logs (use 'logs db' for database logs)"
        echo "  status  - Show container status"
        echo "  clean   - Remove all containers and data"
        ;;
esac