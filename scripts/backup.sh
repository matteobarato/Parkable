#!/bin/bash
# Database backup script

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="parking_spots_backup_${DATE}.sql"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup at $(date)"

# Create backup
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
    --verbose \
    --clean \
    --no-acl \
    --no-owner \
    --format=custom \
    --file="$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

echo "Backup completed: $BACKUP_DIR/${BACKUP_FILE}.gz"

# Remove old backups (keep only last 7 days)
find $BACKUP_DIR -name "parking_spots_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"

# Optional: Upload to cloud storage (uncomment and configure)
# aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" s3://your-backup-bucket/
# gsutil cp "$BACKUP_DIR/${BACKUP_FILE}.gz" gs://your-backup-bucket/

echo "Backup process completed at $(date)"