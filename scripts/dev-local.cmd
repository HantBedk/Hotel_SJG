@rem Arranque local back + front (Windows / Laragon)
@echo off
setlocal

echo === Hotel Manager - dev local ===
echo.

where php >nul 2>&1 || (echo ERROR: PHP no esta en PATH.& exit /b 1)
where node >nul 2>&1 || (echo ERROR: Node no esta en PATH.& exit /b 1)

cd /d "%~dp0..\backend"
echo [1/2] Backend: http://127.0.0.1:8000
start "hotel-api" cmd /k "php artisan serve --host=127.0.0.1 --port=8000"

cd /d "%~dp0..\frontend"
echo [2/2] Frontend: http://127.0.0.1:3007
start "hotel-web" cmd /k "node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 3007"

echo.
echo Abre http://127.0.0.1:3007
echo Login: superadmin@hotelsjg.com / Hotel2024!
echo.
echo Si Vite falla por binarios nativos, ejecuta scripts\fix-frontend-windows.cmd
pause
