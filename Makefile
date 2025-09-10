# Makefile for Parking Spot Finder

.PHONY: help build up down logs clean backup restore test lint

# Default target
help:
	@echo "Parking Spot Finder - Docker Compose Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services"
	@echo "  down      - Stop all services"
	@echo "  restart   - Restart all services"
	@echo "  logs      - View logs from all services"
	@echo "  clean     - Remove all containers, images, and volumes"
	@echo "  backup    - Create database backup"
	@echo "  restore   - Restore database from backup"
	@echo "  test      - Run tests"
	@echo "  lint      - Run code linting"
	@echo "  migrate   - Run database migrations"
	@echo "  shell     - Open shell in backend container"
	@echo "  psql      - Connect to PostgreSQL"
	@echo "  redis-cli - Connect to Redis"
	@echo ""

# Build all images
build:
	@echo "Building Docker images..."
	docker compose build --no-cache

# Start all services
up:
	@echo "Starting services..."
	docker compose up -d
	@echo "Services started! Application available at:"
	@echo "  Frontend: http://localhost"
	@echo "  Backend API: http://localhost/api"
	@echo "  Database: localhost:5432"

# Start services with logs
up-logs:
	@echo "Starting services with logs..."
	docker compose up

# Stop all services
down:
	@echo "Stopping services..."
	docker compose down

# Restart all services
restart: down up

# View logs
logs:
	docker compose logs -f

# View logs for specific service
logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-database:
	docker compose logs -f database

logs-scheduler:
	docker compose logs -f scheduler

# Clean up everything
clean:
	@echo "Cleaning up containers, images, and volumes..."
	docker compose down -v --remove-orphans
	docker system prune -af --volumes

# Create database backup
backup:
	@echo "Creating database backup..."
	docker compose run --rm db_backup

# Restore database (you need to specify the backup file)
restore:
	@echo "Please specify backup file: make restore FILE=backup_file.sql.gz"
	@if [ -z "$(FILE)" ]; then echo "Error: FILE parameter required"; exit 1; fi
	@echo "Restoring database from $(FILE)..."
	gunzip -c ./backups/$(FILE) | docker compose exec -T database psql -U parkinguser -d parking_spots_db

# Run backend tests
test:
	@echo "Running backend tests..."
	docker compose exec backend python -m pytest tests/ -v

# Run frontend tests
test-frontend:
	@echo "Running frontend tests..."
	docker compose exec frontend npm run test:unit

# Lint backend code
lint:
	@echo "Linting backend code..."
	docker compose exec backend flake8 . --max-line-length=100
	docker compose exec backend black --check .

# Lint frontend code
lint-frontend:
	@echo "Linting frontend code..."
	docker compose exec frontend npm run lint

# Run database migrations
migrate:
	@echo "Running database migrations..."
	docker compose exec backend python -c "from app import create_app, db; app=create_app(); app.app_context().push(); db.create_all()"

# Open shell in backend container
shell:
	docker compose exec backend /bin/bash

# Connect to PostgreSQL
psql:
	docker compose exec database psql -U parkinguser -d parking_spots_db

# Connect to Redis
redis-cli:
	docker compose exec redis redis-cli

# Check service status
status:
	docker compose ps

# Show service health
health:
	@echo "Checking service health..."
	@curl -s http://localhost/nginx-health && echo "✓ Nginx is healthy"
	@curl -s http://localhost/api/health && echo "✓ Backend is healthy" || echo "✗ Backend is not responding"

# Development setup
dev-setup:
	@echo "Setting up development environment..."
	cp .env.example .env
	@echo "Please edit .env file with your configuration"
	@echo "Then run 'make up' to start the services"

# Production setup
prod-setup:
	@echo "Setting up production environment..."
	@echo "Make sure to:"
	@echo "1. Update .env with production values"
	@echo "2. Configure SSL certificates in nginx/ssl/"
	@echo "3. Update domain name in nginx configuration"
	@echo "4. Set up monitoring and backups"

# View resource usage
stats:
	docker stats

# Update dependencies
update:
	@echo "Updating backend dependencies..."
	docker compose exec backend pip install --upgrade -r requirements.txt
	@echo "Updating frontend dependencies..."
	docker compose exec frontend npm update