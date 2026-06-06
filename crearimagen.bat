@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   Hotel Manager - Generador de Kit All-in-One
echo ============================================================
echo.

REM ---- 1. Verifica Docker Desktop ------------------------------------
echo [1/5] Verificando Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker Desktop no esta corriendo.
    echo         Abrelo, espera al icono verde, y vuelve a ejecutar.
    echo.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 2. Verifica archivos del proyecto -----------------------------
echo [2/5] Verificando archivos del proyecto...
set MISSING=0
if not exist "Dockerfile.allinone"             ( echo [FALTA] Dockerfile.allinone & set MISSING=1 )
if not exist "docker-compose.allinone.yml"     ( echo [FALTA] docker-compose.allinone.yml & set MISSING=1 )
if not exist "entrypoint.allinone.sh"          ( echo [FALTA] entrypoint.allinone.sh & set MISSING=1 )
if not exist "docker\supervisord.allinone.conf"        ( echo [FALTA] docker\supervisord.allinone.conf & set MISSING=1 )
if not exist "docker\kit\docker-compose.allinone.yml"  ( echo [FALTA] docker\kit\docker-compose.allinone.yml & set MISSING=1 )
if not exist "docker\kit\instalar.bat"                 ( echo [FALTA] docker\kit\instalar.bat & set MISSING=1 )
if not exist "docker\kit\LEEME.txt"                    ( echo [FALTA] docker\kit\LEEME.txt & set MISSING=1 )
if not exist ".env"                            ( echo [FALTA] .env  ^(copia .env.example a .env^) & set MISSING=1 )
if !MISSING! equ 1 (
    echo.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 3. Build de la imagen -----------------------------------------
echo [3/5] Construyendo imagen Docker (puede tardar 5-15 min)...
docker compose -f docker-compose.allinone.yml build
if errorlevel 1 (
    echo.
    echo [ERROR] Fallo el build de Docker.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 4. Resolver carpeta destino del kit ---------------------------
REM Por defecto: Escritorio del usuario. Override con argumento: crearimagen.bat C:\ruta\custom
if "%~1"=="" (
    for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"') do set DESKTOP=%%i
    set KIT_DIR=!DESKTOP!\hotel-allinone-kit
) else (
    set KIT_DIR=%~1
)

echo [4/5] Preparando carpeta del kit: !KIT_DIR!
if not exist "!KIT_DIR!" mkdir "!KIT_DIR!"
echo        OK
echo.

REM ---- 5. Exportar imagen y copiar archivos --------------------------
echo [5/5] Exportando imagen y copiando archivos al kit...
docker save hotel_sjg-hotel:latest -o "!KIT_DIR!\hotel-allinone.tar"
if errorlevel 1 (
    echo [ERROR] Fallo el docker save.
    pause
    exit /b 1
)

REM Copia la versión KIT del compose (con image:, sin build:).
copy /Y "docker\kit\docker-compose.allinone.yml" "!KIT_DIR!\docker-compose.allinone.yml" >nul
copy /Y ".env"                                    "!KIT_DIR!\.env" >nul
copy /Y "docker\kit\instalar.bat"                 "!KIT_DIR!\instalar.bat" >nul
copy /Y "docker\kit\LEEME.txt"                    "!KIT_DIR!\LEEME.txt" >nul

echo        OK
echo.

REM ---- Resumen final --------------------------------------------------
echo ============================================================
echo   Kit generado en:
echo     !KIT_DIR!
echo ============================================================
echo.
dir /B "!KIT_DIR!"
echo.
echo   Para distribuirlo:
echo     1. Copia esta carpeta al PC destino.
echo     2. Doble click en instalar.bat (necesita Docker Desktop corriendo).
echo.
echo   Para generar de nuevo a otra ubicacion:
echo     crearimagen.bat D:\ruta\que\quieras
echo.
pause
endlocal
