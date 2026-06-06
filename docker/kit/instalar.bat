@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   Hotel Manager - Instalador All-in-One
echo ============================================================
echo.

REM ---- 1. Verifica Docker Desktop corriendo --------------------------
echo [1/5] Verificando Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker Desktop no esta corriendo.
    echo         Abrelo manualmente y espera a que el icono este verde,
    echo         luego vuelve a ejecutar este instalador.
    echo.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 2. Verifica archivos del kit ----------------------------------
echo [2/5] Verificando archivos del kit...
if not exist "hotel-allinone.tar" (
    echo [ERROR] Falta: hotel-allinone.tar
    pause
    exit /b 1
)
if not exist "docker-compose.allinone.yml" (
    echo [ERROR] Falta: docker-compose.allinone.yml
    pause
    exit /b 1
)
if not exist ".env" (
    echo [ERROR] Falta: .env
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 3. Carga la imagen --------------------------------------------
echo [3/5] Cargando imagen Docker (puede tardar 1-2 min la primera vez)...
docker load -i "hotel-allinone.tar"
if errorlevel 1 (
    echo [ERROR] Fallo al cargar la imagen.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 4. Levanta el contenedor --------------------------------------
echo [4/5] Levantando contenedor...
docker compose -f docker-compose.allinone.yml up -d
if errorlevel 1 (
    echo [ERROR] Fallo al levantar el contenedor.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 5. Espera a que Postgres + migraciones terminen ---------------
echo [5/5] Inicializando base de datos (espera ~30 seg en primer arranque)...
set /a contador=0
:wait_loop
timeout /t 3 /nobreak >nul
set /a contador+=3
REM Intenta una peticion al backend; si responde, esta listo
curl -s -o nul -w "%%{http_code}" http://localhost/up > "%TEMP%\hotel_check.txt" 2>nul
set /p http_code=<"%TEMP%\hotel_check.txt"
del "%TEMP%\hotel_check.txt" 2>nul
if "!http_code!"=="200" goto ready
if !contador! geq 90 goto timeout
echo        ... esperando (!contador! seg)
goto wait_loop

:timeout
echo.
echo [AVISO] El sistema tarda mas de lo esperado.
echo         Revisa los logs con:
echo             docker compose -f docker-compose.allinone.yml logs -f
goto end

:ready
echo        Listo!
echo.

:end
echo ============================================================
echo   Sistema funcionando
echo ============================================================
echo.
echo   Web:        http://localhost
echo   WebSocket:  ws://localhost:8080
echo.
echo   Comandos utiles:
echo     - Ver logs:    docker compose -f docker-compose.allinone.yml logs -f
echo     - Detener:     docker compose -f docker-compose.allinone.yml down
echo     - Reiniciar:   docker compose -f docker-compose.allinone.yml restart
echo.
echo   Abriendo navegador...
start "" http://localhost
echo.
pause
endlocal
