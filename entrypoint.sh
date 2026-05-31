#!/bin/bash
set -e

cd /var/www/html

echo "=== Hotel Manager — Iniciando ==="

# Generar APP_KEY si no existe
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
fi

# Cache de configuración
php artisan config:cache
php artisan route:cache
php artisan view:cache

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
