@echo off
REM update.bat — Hotel Manager: actualizacion del sistema en produccion local (Windows)
REM Uso: doble-click o ejecutar desde CMD en la carpeta del proyecto
REM Requisitos: Docker Desktop corriendo

setlocal enabledelayedexpansion

echo === Hotel Manager - Actualizacion del Sistema ===
echo Fecha: %DATE% %TIME%
echo.

REM Paso 1: backup antes de cambiar nada
echo [1/5] Creando backup de seguridad...
docker exec hotel_app php artisan hotel:backup --quiet 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo     AVISO: backup no pudo completarse, continuando de todas formas...
) else (
    echo     Backup completado.
)

REM Paso 2: bajar contenedores
echo [2/5] Deteniendo servicios...
docker compose -f "%~dp0docker-compose.yml" down
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron detener los contenedores.
    pause
    exit /b 1
)

REM Paso 3: reconstruir imagenes
echo [3/5] Reconstruyendo imagenes (puede tardar varios minutos)...
docker compose -f "%~dp0docker-compose.yml" build --no-cache
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo al reconstruir las imagenes.
    pause
    exit /b 1
)

REM Paso 4: levantar servicios
echo [4/5] Iniciando servicios...
docker compose -f "%~dp0docker-compose.yml" up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron iniciar los servicios.
    pause
    exit /b 1
)

REM Paso 5: migraciones y cache
echo [5/5] Ejecutando migraciones y limpiando cache...
timeout /t 8 /nobreak >nul
docker exec hotel_app php artisan migrate --force
docker exec hotel_app php artisan config:cache
docker exec hotel_app php artisan route:cache
docker exec hotel_app php artisan view:cache

echo.
echo === Actualizacion completada con exito ===
echo.
echo Si algo falla, restaura el backup desde Configuracion > Backups en la app.
echo.
pause
