#!/bin/bash
set -euo pipefail

# Configura backup automático: 23:59 diario, 7 días de retención.
# Uso en VPS: bash scripts/vps-configure-backup.sh

BACKUP_DIR=/var/backups/hotel
CONTAINER=hotel_app
DB_CONTAINER=hotel_db

mkdir -p "$BACKUP_DIR"
chown 82:82 "$BACKUP_DIR"
chmod 775 "$BACKUP_DIR"

docker exec "$DB_CONTAINER" psql -U hotel_user -d hotel_sjg -v ON_ERROR_STOP=1 \
  -c "UPDATE settings SET value = 'true' WHERE key = 'backup.auto_backup';" \
  -c "UPDATE settings SET value = '23:59' WHERE key = 'backup.auto_backup_time';" \
  -c "UPDATE settings SET value = '7' WHERE key = 'backup.retention_days';" \
  -c "UPDATE settings SET value = '/var/www/html/backup' WHERE key = 'backup.auto_backup_folder';"

echo "=== Configuración actual ==="
docker exec "$DB_CONTAINER" psql -U hotel_user -d hotel_sjg -c "SELECT key, value FROM settings WHERE key LIKE 'backup.%' ORDER BY key;"

echo "=== Prueba backup:auto ==="
docker exec -u www-data "$CONTAINER" php artisan backup:auto

echo "=== Archivos en $BACKUP_DIR ==="
ls -la "$BACKUP_DIR"

echo "=== Listo ==="
