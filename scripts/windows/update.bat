@echo off
REM update.bat — Actualizacion del sistema (Windows)
setlocal enabledelayedexpansion
cd /d "%~dp0..\.."

echo === Hotel Manager - Actualizacion del Sistema ===
echo Fecha: %DATE% %TIME%
echo.

echo [1/5] Creando backup de seguridad...
docker exec hotel_app php artisan hotel:backup --quiet 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo     AVISO: backup no pudo completarse, continuando de todas formas...
) else (
    echo     Backup completado.
)

echo [2/5] Deteniendo servicios...
docker compose -f docker-compose.yml down
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron detener los contenedores.
    pause
    exit /b 1
)

echo [3/5] Reconstruyendo imagenes (puede tardar varios minutos)...
docker compose -f docker-compose.yml build --no-cache
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo al reconstruir las imagenes.
    pause
    exit /b 1
)

echo [4/5] Iniciando servicios...
docker compose -f docker-compose.yml up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron iniciar los servicios.
    pause
    exit /b 1
)

echo [5/5] Ejecutando migraciones y limpiando cache...
timeout /t 8 /nobreak >nul
docker exec hotel_app php artisan migrate --force
docker exec hotel_app php artisan config:cache
docker exec hotel_app php artisan route:cache
docker exec hotel_app php artisan view:cache

echo.
echo === Actualizacion completada con exito ===
echo.
echo Si algo falla, restaura el backup desde Configuracion ^> Backups en la app.
echo.
pause
