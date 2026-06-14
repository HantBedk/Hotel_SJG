#!/bin/bash
# deploy.sh — Despliegue en VPS (Linux) vía SSH
# Uso (desde la raíz del proyecto):
#   bash scripts/deploy.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
    echo "[ERROR] Falta .env en la raíz del proyecto."
    echo "        cp config/env.vps.example .env   # VPS hotel.dataguaviare.com.co"
    echo "        Completa APP_KEY, DB_PASSWORD y REVERB_APP_SECRET."
    exit 1
fi

echo "=== Hotel Manager — Despliegue VPS ==="
echo "Directorio: $ROOT_DIR"
echo "Fecha: $(date)"
echo ""

COMPOSE="-f docker-compose.yml -f docker/compose/docker-compose.prod.yml"

echo "[1/3] Construyendo imágenes..."
docker compose $COMPOSE build

echo "[2/3] Levantando servicios (HTTP en 127.0.0.1:${HTTP_PORT:-8081})..."
docker compose $COMPOSE up -d

echo "[3/3] Verificando salud..."
sleep 8
if docker exec hotel_app php artisan migrate --force >/dev/null 2>&1; then
    echo "    Migraciones OK."
else
    echo "    AVISO: migraciones pendientes o contenedor aún iniciando."
fi

echo ""
echo "=== Despliegue completado ==="
echo ""
echo "App interna:  http://127.0.0.1:${HTTP_PORT:-8081}"
echo "Público:        https://hotel.dataguaviare.com.co"
echo "Nginx host:     docker/vps-hotel.dataguaviare.com.co.conf"
echo ""
