#!/bin/bash
# update.sh — Hotel Manager: actualización del sistema en producción local
# Uso: ./update.sh
# Requisitos: Docker running, proyecto en /opt/hotel_sjg o ruta donde está este script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_LABEL="pre_update_$(date +%Y%m%d_%H%M%S)"

echo "=== Hotel Manager — Actualización del Sistema ==="
echo "Fecha: $(date)"
echo "Directorio: $SCRIPT_DIR"
echo ""

# Paso 1: backup automático antes de cualquier cambio
echo "[1/5] Creando backup de seguridad..."
docker exec hotel_app php artisan hotel:backup --quiet 2>/dev/null || true
echo "    Backup completado (ver /storage/app/backups/ dentro del contenedor)."

# Paso 2: bajar contenedores
echo "[2/5] Deteniendo servicios..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" down

# Paso 3: si hay nueva versión en el directorio (pull o copia manual previa)
echo "[3/5] Reconstruyendo imágenes..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" build --no-cache

# Paso 4: levantar servicios
echo "[4/5] Iniciando servicios..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

# Paso 5: migraciones y cache
echo "[5/5] Ejecutando migraciones y limpiando caché..."
sleep 5  # esperar que PHP-FPM inicie
docker exec hotel_app php artisan migrate --force
docker exec hotel_app php artisan config:cache
docker exec hotel_app php artisan route:cache
docker exec hotel_app php artisan view:cache

echo ""
echo "=== Actualización completada con éxito ==="
echo ""
echo "Si algo falla, restaura el backup con:"
echo "    docker exec hotel_app php artisan hotel:restore <archivo_backup.zip>"
