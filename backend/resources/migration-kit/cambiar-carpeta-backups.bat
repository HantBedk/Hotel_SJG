@echo off
setlocal enabledelayedexpansion
echo === Hotel Manager - Cambiar carpeta de backups ===
echo.

REM ── Verificar Docker ────────────────────────────────────────────────────────
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Inicia Docker Desktop y vuelve a intentar.
    pause
    exit /b 1
)

if not exist .env (
    echo [ERROR] No se encuentra el archivo .env en esta carpeta.
    echo         Asegurate de ejecutar este script desde la carpeta del proyecto.
    pause
    exit /b 1
)

REM ── Mostrar carpeta actual ──────────────────────────────────────────────────
for /f "tokens=1,* delims==" %%a in ('findstr /b "BACKUP_HOST_PATH=" .env') do (
    set "CURRENT=%%b"
)
if not defined CURRENT (
    echo Carpeta actual: ^(no configurada, usa .\backup por defecto^)
) else (
    echo Carpeta actual: !CURRENT!
)
echo.

REM ── Pedir carpeta nueva ─────────────────────────────────────────────────────
set /p NEWPATH="Nueva carpeta (ej. D:\Hotel\backups): "
if "!NEWPATH!"=="" (
    echo [CANCELADO] No se ingreso ninguna ruta.
    pause
    exit /b 0
)

REM ── Crear la carpeta si no existe ───────────────────────────────────────────
if not exist "!NEWPATH!" (
    echo Creando carpeta !NEWPATH! ...
    mkdir "!NEWPATH!" 2>nul
    if errorlevel 1 (
        echo [ERROR] No se pudo crear la carpeta. Verifica que la ruta sea valida.
        pause
        exit /b 1
    )
    echo [OK] Carpeta creada.
)

REM ── Actualizar .env via PowerShell (mas confiable que cmd para regex) ───────
echo Actualizando .env ...
powershell -NoProfile -Command ^
    "$path = '!NEWPATH!';" ^
    "$content = Get-Content -Raw -Encoding UTF8 .env;" ^
    "if ($content -match '(?m)^#?BACKUP_HOST_PATH=.*$') {" ^
    "  $content = [regex]::Replace($content, '(?m)^#?BACKUP_HOST_PATH=.*$', \"BACKUP_HOST_PATH=$path\");" ^
    "} else {" ^
    "  $content = $content.TrimEnd() + \"`r`nBACKUP_HOST_PATH=$path`r`n\";" ^
    "}" ^
    "[System.IO.File]::WriteAllText((Resolve-Path .env), $content, [System.Text.UTF8Encoding]::new($false));"

if errorlevel 1 (
    echo [ERROR] Fallo la actualizacion del .env.
    pause
    exit /b 1
)
echo [OK] .env actualizado.

REM ── Recrear container app para que tome el nuevo volume ─────────────────────
echo.
echo Reiniciando container app ^(toma el nuevo volumen^)...
docker compose up -d app
if errorlevel 1 (
    echo [ERROR] Fallo el reinicio del container.
    pause
    exit /b 1
)

REM ── Limpiar cache de Laravel ────────────────────────────────────────────────
docker compose exec -T app php artisan config:clear >nul 2>&1

REM ── Probar con un backup ────────────────────────────────────────────────────
echo.
echo Generando backup de prueba para verificar...
docker compose exec -T app php artisan backup:auto

echo.
echo === Listo ===
echo Los backups automaticos diarios apareceran en:
echo   !NEWPATH!
echo.
echo Si no aparecio el .zip de prueba, revisa:
echo   - Docker Desktop ^> Settings ^> Resources ^> File Sharing ^(autoriza la unidad^)
echo   - Que la carpeta tenga permisos de escritura.
echo.
pause
