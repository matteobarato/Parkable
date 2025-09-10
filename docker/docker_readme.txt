# 🐳 Docker Deployment Guide

Complete Docker containerization for the Parking Spot Finder application with production-ready configuration.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (Port 80/443)                │
│                    Reverse Proxy & Load Balancer           │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Vue.js        │ │   Flask API     │ │   Background    │
│   Frontend      │ │   Backend       │ │   Scheduler     │
│   (Port 80)     │ │   (Port 5000)   │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                          │                │
         ┌────────────────┼────────────────┘
         │                │
         ▼                ▼
┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │     Redis       │
│   + PostGIS     │ │     Cache       │
│   (Port 5432)   │ │   (Port 6379)   │
└─────────────────┘ └─────────────────┘
```

## 📦 Services

- **Nginx**: Reverse proxy, load balancer, SSL termination
- **Frontend**: Vue.js application served by Nginx
- **Backend**: Flask API with Gunicorn WSGI server
- **Scheduler**: Background job processor for spot cleanup
- **Database**: PostgreSQL with PostGIS extension
- **Redis**: Caching and session storage
- **Backup**: Automated database backup service

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd parking-spot-finder

# Copy environment file and customize
cp .env.example .env
nano .env  # Edit with your configuration
```

### 2. Build and Start

```bash
# Using Make (recommended)
make build
make up

# Or using Docker Compose directly
docker-compose build
docker-compose up -d
```

### 3. Access Application

- **Frontend**: http://localhost
- **API**: http://localhost/api
- **Database**: localhost:5432

## 🛠️ Configuration

### Environment Variables (.env)

```bash
# Database
POSTGRES_DB=parking_spots_db
POSTGRES_USER=parkinguser
POSTGRES_PASSWORD=your-secure-password

# Flask
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this
FLASK_ENV=production

# URLs
DATABASE_URL=postgresql://parkinguser:password@database:5432/parking_spots_db
REDIS_URL=redis://redis:6379/0
VUE_APP_API_BASE_URL=http://localhost/api
```

### File Structure

```
parking-spot-finder/
├── docker-compose.yml           # Main orchestration file
├── .env                        # Environment variables
├── Makefile                    # Convenience commands
├── backend/
│   ├── Dockerfile              # Backend container
│   ├── Dockerfile.scheduler    # Scheduler container
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── Dockerfile              # Frontend container
│   └── nginx.conf              # Frontend nginx config
├── nginx/
│   ├── nginx.conf              # Main nginx config
│   └── ssl/                    # SSL certificates
├── database/
│   └── init.sql               # Database initialization
├── scripts/
│   └── backup.sh              # Backup script
└── backups/                   # Database backups
```

## 📋 Available Commands

### Using Make (Recommended)

```bash
make help          # Show all available commands
make build         # Build all Docker images
make up            # Start all services
make down          # Stop all services
make logs          # View logs from all services
make clean         # Remove all containers and volumes
make backup        # Create database backup
make shell         # Open shell in backend container
make psql          # Connect to PostgreSQL
make status        # Check service status
```

### Direct Docker Compose Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Scale services
docker-compose up -d --scale backend=3
```

## 🔒 Production Setup

### 1. SSL/HTTPS Configuration

```bash
# Generate SSL certificates (example with Let's Encrypt)
mkdir -p nginx/ssl
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

### 2. Update nginx configuration

```nginx
# Uncomment HTTPS server block in nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of SSL configuration
}
```

### 3. Security Hardening

```bash
# Update environment variables
FLASK_ENV=production
SECRET_KEY=use-a-strong-random-key-here
JWT_SECRET_KEY=use-another-strong-random-key-here

# Use strong database password
POSTGRES_PASSWORD=use-a-very-strong-password

# Restrict database access (in docker-compose.yml)
# Remove database port mapping for production:
# ports:
#   - "5432:5432"  # Comment this out
```

### 4. Resource Limits

```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check service health
make health

# View service status
make status

# Monitor resource usage
make stats
```

### Database Backups

```bash
# Create manual backup
make backup

# Restore from backup
make restore FILE=parking_spots_backup_20231201_120000.sql.gz

# Automated backups run via cron:
# 0 2 * * * cd /path/to/app && make backup
```

### Log Management

```bash
# View all logs
make logs

# View specific service logs
make logs-backend
make logs-frontend
make logs-database

# Follow logs in real-time
docker-compose logs -f --tail=100
```

## 🔧 Development

### Local Development with Docker

```bash
# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Hot reload for development
# Mount source code as volumes in docker-compose.dev.yml
```

### Running Tests

```bash
# Backend tests
make test

# Frontend tests
make test-frontend

# Code linting
make lint
make lint-frontend
```

### Database Operations

```bash
# Connect to database
make psql

# Run migrations
make migrate

# Connect to Redis
make redis-cli
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using ports
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :5432
   ```

2. **Permission errors**
   ```bash
   # Fix Docker permissions
   sudo chown -R $USER:$USER .
   ```

3. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs database
   
   # Verify database is ready
   docker-compose exec database pg_isready -U parkinguser
   ```

4. **Frontend not loading**
   ```bash
   # Rebuild frontend
   docker-compose build frontend
   docker-compose up -d frontend
   ```

### Performance Optimization

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Monitor resource usage
docker stats

# Clean up unused resources
docker system prune -f
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
make down
make build
make up
```

### Dependency Updates

```bash
# Update dependencies
make update

# Or manually:
docker-compose exec backend pip install --upgrade -r requirements.txt
docker-compose exec frontend npm update
```

### Database Migrations

```bash
# Run migrations
make migrate

# Or manually:
docker-compose exec backend python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
"
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3 --scale scheduler=2

# Use Docker Swarm for production scaling
docker swarm init
docker stack deploy -c docker-compose.yml parking-app
```

### Load Balancing

Nginx automatically load balances between multiple backend instances. For production, consider:

- External load balancer (AWS ALB, Google Load Balancer)
- CDN for static assets (CloudFlare, AWS CloudFront)
- Database replicas for read scaling

## 🛡️ Security Checklist

- [ ] Change default passwords
- [ ] Use strong secret keys
- [ ] Enable HTTPS with valid certificates
- [ ] Remove unnecessary port mappings
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Backup encryption
- [ ] Network segmentation
- [ ] Access logging

## 📞 Support

For issues with the Docker setup:

1. Check logs: `make logs`
2. Verify service health: `make health`
3. Review configuration files
4. Check Docker and Docker Compose versions
5. Ensure all required ports are available

This Docker setup provides a complete, production-ready deployment of the Parking Spot Finder application with proper security, monitoring, and maintenance capabilities.