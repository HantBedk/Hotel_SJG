#!/bin/bash
set -e

PGDATA=/var/lib/postgresql/data
PGUSER=${DB_USERNAME:-hotel_user}
PGPASS=${DB_PASSWORD:-changeme_strong_password}
PGDB=${DB_DATABASE:-hotel_sjg}

echo "=== Hotel Manager All-in-One — Iniciando ==="

# ─── 1. Inicializar Postgres si nunca se ha iniciado ────────────────────
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "[postgres] Inicializando cluster por primera vez..."
    chown -R postgres:postgres "$PGDATA"
    su-exec postgres initdb --pgdata="$PGDATA" --username=postgres --auth-host=md5 --auth-local=trust --encoding=UTF8 >/dev/null

    # Permitir conexiones locales con contraseña md5
    echo "host all all 127.0.0.1/32 md5" >> "$PGDATA/pg_hba.conf"
    echo "host all all ::1/128 md5"      >> "$PGDATA/pg_hba.conf"
    echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"

    # Arrancar temporalmente para crear usuario + DB
    su-exec postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses=127.0.0.1" -w start

    echo "[postgres] Creando usuario '$PGUSER' y base '$PGDB'..."
    su-exec postgres psql -v ON_ERROR_STOP=1 --username=postgres <<-EOSQL
        CREATE USER $PGUSER WITH PASSWORD '$PGPASS';
        CREATE DATABASE $PGDB OWNER $PGUSER;
        GRANT ALL PRIVILEGES ON DATABASE $PGDB TO $PGUSER;
EOSQL

    su-exec postgres pg_ctl -D "$PGDATA" -m fast -w stop
    echo "[postgres] Cluster listo."
fi

# ─── 2. Arrancar Postgres en background (lo gestionará supervisord luego) ─
echo "[postgres] Arrancando..."
su-exec postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses=127.0.0.1" -w start

# Esperar a que esté ready
until su-exec postgres pg_isready -h 127.0.0.1 -U "$PGUSER" -d "$PGDB" >/dev/null 2>&1; do
    sleep 1
done

# ─── 3. Laravel: permisos, APP_KEY, cache ────────────────────────────────
cd /var/www/html

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

KEY_FILE=/var/www/html/storage/.app_key
if [ -f "$KEY_FILE" ]; then
    SAVED_KEY=$(cat "$KEY_FILE")
    sed -i "s|^APP_KEY=.*|APP_KEY=${SAVED_KEY}|" .env
elif [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "[laravel] Generando APP_KEY..."
    php artisan key:generate --force
    grep "^APP_KEY=" .env | cut -d= -f2- > "$KEY_FILE"
else
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
    echo "$APP_KEY" > "$KEY_FILE"
fi

[ -z "$APP_KEY" ]   && unset APP_KEY
[ -z "$APP_DEBUG" ] && unset APP_DEBUG

# Forzar DB_HOST=127.0.0.1 (postgres está en el mismo contenedor)
export DB_HOST=127.0.0.1
export DB_PORT=5432

php artisan config:cache
php artisan route:cache

# ─── 4. Migraciones + seeders ───────────────────────────────────────────
echo "[laravel] Ejecutando migraciones..."
php artisan migrate --force

if [ ! -f /var/www/html/storage/.seeded ]; then
    echo "[laravel] Ejecutando seeders iniciales..."
    php artisan db:seed --force
    touch /var/www/html/storage/.seeded
else
    echo "[laravel] Seeders ya ejecutados — omitiendo."
fi

# ─── 5. Permisos finales — artisan/seeders crearon archivos como root ────
# Si no hacemos esto, php-fpm (www-data) no puede escribir en cache/sessions.
echo "[laravel] Ajustando permisos finales de storage..."
chown -R www-data:www-data storage bootstrap/cache
find storage bootstrap/cache -type d -exec chmod 775 {} \;
find storage bootstrap/cache -type f -exec chmod 664 {} \;

# ─── 6. Detener Postgres para que supervisord lo gestione ─────────────────
echo "[postgres] Deteniendo para entregar control a supervisord..."
su-exec postgres pg_ctl -D "$PGDATA" -m fast -w stop

REVERB_UPSTREAM="${REVERB_UPSTREAM:-127.0.0.1:8080}"
sed "s|__REVERB_UPSTREAM__|${REVERB_UPSTREAM}|g" \
    /etc/nginx/templates/default.conf > /etc/nginx/http.d/default.conf

echo "=== Sistema listo — entregando a supervisord ==="
exec /usr/bin/supervisord -c /etc/supervisord.conf
