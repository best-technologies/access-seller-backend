#!/bin/bash

# Database connection strings
SOURCE_DB="postgresql://access_sellr_prod_db_user:2StEjx19f7vfMNcLKc6Z52vAGin7p1FG@dpg-d1unulmr433s73ev7fsg-a.oregon-postgres.render.com/access_sellr_prod_db"
TARGET_DB="postgresql://neondb_owner:npg_xdpK46YfMSUj@ep-steep-moon-ad5hht4p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Create backup directory
BACKUP_DIR="../backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Starting database backup and restore process..."
echo "Source: ${SOURCE_DB//:[^:]*@/:***@}"
echo "Target: ${TARGET_DB//:[^:]*@/:***@}"

# Step 1: Create backup
echo "Creating backup..."
pg_dump "$SOURCE_DB" --no-owner --no-privileges --clean --if-exists --create > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "Backup file size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Backup failed"
    exit 1
fi

# Step 2: Test connection to target database
echo "Testing connection to Neon database..."
psql "$TARGET_DB" -c "SELECT version();" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Connection to Neon database successful"
else
    echo "❌ Failed to connect to Neon database"
    exit 1
fi

# Step 3: Restore to Neon database
echo "Restoring backup to Neon database..."
psql "$TARGET_DB" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully!"
else
    echo "❌ Restore failed"
    exit 1
fi

# Step 4: Verify restore
echo "Verifying restore..."

# Get table counts
echo "Source database tables:"
psql "$SOURCE_DB" -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo "Target database tables:"
psql "$TARGET_DB" -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "✅ Database backup and restore completed successfully!"
echo "Backup file saved at: $BACKUP_FILE"
