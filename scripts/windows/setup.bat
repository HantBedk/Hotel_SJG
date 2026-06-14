@echo off
REM Hotel Manager — setup inicial (Windows)
REM Uso: scripts\windows\setup.bat
setlocal enabledelayedexpansion
cd /d "%~dp0..\.."
echo === Hotel Manager — Setup Inicial ===
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Inicia Docker Desktop y vuelve a intentar.
    exit /b 1
)

echo [1/3] Instalando dependencias Laravel (composer install)...
docker run --rm -v "%CD%\backend":/app -w /app composer:2 ^
    install --no-interaction --no-progress --optimize-autoloader
if errorlevel 1 (
    echo [ERROR] Fallo composer install.
    exit /b 1
)
echo [OK] Dependencias Laravel instaladas.

echo [2/3] Instalando dependencias React (npm install)...
docker run --rm -v "%CD%\frontend":/app -w /app node:20-alpine ^
    npm install
if errorlevel 1 (
    echo [ERROR] Fallo npm install.
    exit /b 1
)
echo [OK] Dependencias React instaladas.

echo [3/3] Configurando .env...
if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env creado desde .env.example
) else (
    echo [SKIP] .env ya existe.
)
if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo [OK] backend/.env creado desde backend/.env.example
) else (
    echo [SKIP] backend/.env ya existe.
)
if not exist frontend\.env (
    copy frontend\.env.example frontend\.env >nul
    echo [OK] frontend/.env creado desde frontend/.env.example
) else (
    echo [SKIP] frontend/.env ya existe.
)

echo.
echo === Setup completo ===
echo.
echo Proximos pasos:
echo   1. Edita .env y backend/.env con tus credenciales
echo   2. Ejecuta: docker compose up --build
echo.
