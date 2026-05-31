#!/bin/bash
set -e

cd /var/www/html

echo "=== Hotel Manager — Iniciando ==="

# Fix storage permissions (volume mount may reset them)
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Persist APP_KEY across restarts using storage volume
KEY_FILE=/var/www/html/storage/.app_key
if [ -f "$KEY_FILE" ]; then
    SAVED_KEY=$(cat "$KEY_FILE")
    sed -i "s|^APP_KEY=.*|APP_KEY=${SAVED_KEY}|" .env
elif [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
    grep "^APP_KEY=" .env | cut -d= -f2- > "$KEY_FILE"
else
    # Key provided via environment variable
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
    echo "$APP_KEY" > "$KEY_FILE"
fi

# Cache de configuración
# Unset any empty env vars that docker-compose may inject so dotenv/.env takes over
[ -z "$APP_KEY" ]   && unset APP_KEY
[ -z "$APP_DEBUG" ] && unset APP_DEBUG
php artisan config:cache
php artisan route:cache
# No view:cache — pure SPA project, no Blade views

# Ejecutar migraciones
echo "Ejecutando migraciones..."
php artisan migrate --force

# Seeders solo en primer arranque (flag de control)
if [ ! -f /var/www/html/storage/.seeded ]; then
    echo "Ejecutando seeders iniciales..."
    php artisan db:seed --force
    touch /var/www/html/storage/.seeded
    echo "Seeders completados."
else
    echo "Seeders ya ejecutados — omitiendo."
fi

echo "=== Sistema listo ==="

exec /usr/bin/supervisord -c /etc/supervisord.conf
