#!/bin/bash
set -e

cd /var/www/html

echo "=== Hotel Manager — Iniciando ==="

# Fix storage permissions (volume mount may reset them)
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Enlace public/storage → storage/app/public (logos, comprobantes, etc.)
php artisan storage:link --force

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

# Unset any empty env vars that docker-compose may inject so dotenv/.env takes over
[ -z "$APP_KEY" ]   && unset APP_KEY
[ -z "$APP_DEBUG" ] && unset APP_DEBUG

# Cache de configuración — redescubrir paquetes según vendor real (--no-dev en imagen).
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php bootstrap/cache/config.php
php artisan package:discover --ansi
php artisan config:cache
php artisan route:cache
# No view:cache — pure SPA project, no Blade views

# Ejecutar migraciones
echo "Ejecutando migraciones..."
php artisan migrate --force

# Seeders en primer arranque, o si la BD quedó vacía (.seeded huérfano del volumen host).
USER_COUNT=$(PGPASSWORD="${DB_PASSWORD:-changeme_strong_password}" psql -h "${DB_HOST:-db}" -U "${DB_USERNAME:-hotel_user}" -d "${DB_DATABASE:-hotel_sjg}" -tAc "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
USER_COUNT=$(echo "$USER_COUNT" | tr -d '[:space:]')

if [ ! -f /var/www/html/storage/.seeded ] || [ "$USER_COUNT" = "0" ]; then
    echo "Ejecutando seeders iniciales (users=${USER_COUNT})..."
    php artisan db:seed --force
    touch /var/www/html/storage/.seeded
    echo "Seeders completados."
else
    echo "Seeders ya ejecutados — omitiendo."
fi

# Nginx: upstream de Reverb (sustituido por entrypoint; ver default.conf)
REVERB_UPSTREAM="${REVERB_UPSTREAM:-reverb:8080}"
sed "s|__REVERB_UPSTREAM__|${REVERB_UPSTREAM}|g" \
    /etc/nginx/templates/default.conf > /etc/nginx/http.d/default.conf

echo "=== Sistema listo ==="

exec /usr/bin/supervisord -c /etc/supervisord.conf
