# Environment variables for Docker Compose
# Copy this file to .env and modify values for production

# Database Configuration
POSTGRES_DB=parking_spots_db
POSTGRES_USER=parkinguser
POSTGRES_PASSWORD=parkingpass123

# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secret-production-key-change-this-immediately
JWT_SECRET_KEY=your-jwt-secret-production-key-change-this-immediately

# Database URLs
DATABASE_URL=postgresql://parkinguser:parkingpass123@database:5432/parking_spots_db
REDIS_URL=redis://redis:6379/0

# Frontend Configuration
VUE_APP_API_BASE_URL=http://localhost/api
NODE_ENV=production

# SSL Configuration (for production)
SSL_CERT_PATH=./nginx/ssl/cert.pem
SSL_KEY_PATH=./nginx/ssl/key.pem

# Backup Configuration
BACKUP_RETENTION_DAYS=7
BACKUP_S3_BUCKET=your-backup-bucket
BACKUP_GCS_BUCKET=your-backup-bucket

# Monitoring (optional)
ENABLE_MONITORING=false
GRAFANA_ADMIN_PASSWORD=admin123

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password