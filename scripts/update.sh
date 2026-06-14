#!/bin/bash
# update.sh — Actualización del sistema en producción
# Uso (desde la raíz del proyecto):
#   bash scripts/update.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Hotel Manager — Actualización del Sistema ==="
echo "Fecha: $(date)"
echo "Directorio: $ROOT_DIR"
echo ""

echo "[1/5] Creando backup de seguridad..."
docker exec hotel_app php artisan hotel:backup --quiet 2>/dev/null || true
echo "    Backup completado (ver /storage/app/backups/ dentro del contenedor)."

echo "[2/5] Deteniendo servicios..."
docker compose -f docker-compose.yml down

echo "[3/5] Reconstruyendo imágenes..."
COMPOSE_FILES="-f docker-compose.yml"
if [ -f .env ] && grep -qE '^HTTP_BIND=127\.0\.0\.1' .env 2>/dev/null; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker/compose/docker-compose.prod.yml"
fi
docker compose $COMPOSE_FILES build --no-cache

echo "[4/5] Iniciando servicios..."
docker compose $COMPOSE_FILES up -d

echo "[5/5] Ejecutando migraciones y limpiando caché..."
sleep 5
docker exec hotel_app php artisan migrate --force
docker exec hotel_app php artisan config:cache
docker exec hotel_app php artisan route:cache
docker exec hotel_app php artisan view:cache

echo ""
echo "=== Actualización completada con éxito ==="
echo ""
echo "Si algo falla, restaura el backup con:"
echo "    docker exec hotel_app php artisan hotel:restore <archivo_backup.zip>"
echo ""
