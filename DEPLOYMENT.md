# Insurance Platform Deployment Guide

This guide will help you deploy your non-profit insurance platform using Docker containers with PostgreSQL database provisioning.

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (for AI damage assessment features)
- Domain name or server IP address

## Quick Start

1. **Clone and prepare the application:**
   ```bash
   # Ensure all files are in place
   ls -la
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the Docker environment template
   cp .env.docker .env.production
   
   # Edit the production environment file
   nano .env.production
   ```

3. **Build and start the application:**
   ```bash
   # Build the Docker image
   docker build -t insurance-platform .
   
   # Start all services (database + application)
   docker-compose up -d
   ```

4. **Verify deployment:**
   ```bash
   # Check service status
   docker-compose ps
   
   # View application logs
   docker-compose logs -f app
   
   # Test health endpoint
   curl http://localhost:5000/api/health
   ```

## Configuration

### Required Environment Variables

Update `.env.production` with your specific values:

```env
# Security (REQUIRED - Change these!)
SESSION_SECRET=your-very-secure-session-secret-at-least-32-characters

# Database (Already configured for Docker)
DATABASE_URL=postgresql://insurance_user:insurance_password@postgres:5432/insurance_platform

# Authentication (Update for your domain)
REPL_ID=your-repl-id
REPLIT_DOMAINS=yourdomain.com,www.yourdomain.com

# AI Features (REQUIRED for damage assessment)
OPENAI_API_KEY=your-openai-api-key-here
```

### Optional Configuration

```env
# Custom database credentials (if changing defaults)
PGUSER=your_db_user
PGPASSWORD=your_secure_db_password
PGDATABASE=your_database_name

# Application settings
PORT=5000
HOST=0.0.0.0
```

## Database Setup

The database is automatically provisioned with:
- User authentication tables
- Insurance policy management
- Claims processing system
- Payment tracking
- Proper indexes for performance

Tables created:
- `users` - Member accounts
- `policies` - Insurance policies
- `claims` - Claims management
- `payments` - Payment tracking
- `sessions` - Authentication sessions

## Production Deployment

### Using Docker Compose (Recommended)

1. **Update docker-compose.yml for production:**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: insurance_platform
         POSTGRES_USER: insurance_user
         POSTGRES_PASSWORD: your-secure-password
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
       restart: unless-stopped
     
     app:
       build: .
       ports:
         - "80:5000"
       env_file:
         - .env.production
       depends_on:
         - postgres
       restart: unless-stopped
   ```

2. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Using Individual Docker Commands

```bash
# Create network
docker network create insurance-network

# Start PostgreSQL
docker run -d \
  --name insurance-postgres \
  --network insurance-network \
  -e POSTGRES_DB=insurance_platform \
  -e POSTGRES_USER=insurance_user \
  -e POSTGRES_PASSWORD=your-secure-password \
  -v postgres_data:/var/lib/postgresql/data \
  -v ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql \
  postgres:15-alpine

# Start application
docker run -d \
  --name insurance-app \
  --network insurance-network \
  -p 80:5000 \
  --env-file .env.production \
  insurance-platform
```

## Monitoring and Maintenance

### Health Checks

```bash
# Application health
curl http://your-domain.com/api/health

# Database connection
docker exec insurance-postgres pg_isready -U insurance_user -d insurance_platform
```

### Log Management

```bash
# View all logs
docker-compose logs

# Follow application logs
docker-compose logs -f app

# View database logs
docker-compose logs postgres
```

### Backup and Recovery

```bash
# Database backup
docker exec insurance-postgres pg_dump -U insurance_user insurance_platform > backup.sql

# Database restore
docker exec -i insurance-postgres psql -U insurance_user insurance_platform < backup.sql
```

## Security Considerations

1. **Change default passwords** in production
2. **Use HTTPS** with SSL certificates (nginx/caddy proxy recommended)
3. **Firewall configuration** - only expose necessary ports
4. **Regular updates** of Docker images
5. **Environment variables** - never commit secrets to code

## Scaling

For high-traffic deployments:

1. **Load balancer** - Use nginx or cloud load balancer
2. **Database scaling** - Consider read replicas
3. **Container orchestration** - Kubernetes for enterprise
4. **CDN** - For static assets
5. **Monitoring** - Prometheus + Grafana

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   ```bash
   docker-compose logs postgres
   docker exec -it insurance-postgres psql -U insurance_user insurance_platform
   ```

2. **Application won't start:**
   ```bash
   docker-compose logs app
   # Check environment variables
   ```

3. **Authentication issues:**
   - Verify REPLIT_DOMAINS matches your domain
   - Check SESSION_SECRET is set
   - Ensure REPL_ID is correct

### Port Conflicts

If port 5000 is in use:
```bash
# Use different port
docker-compose up -d --scale app=1 -p 8080:5000
```

## Support

The platform includes:
- Non-profit insurance management
- AI-powered damage assessment
- Bitcoin payment integration
- Member-owned mutual structure
- Transparent financial reporting

For technical support or customization, refer to the application documentation or contact your development team.