@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   Hotel Manager - Generador de Kit All-in-One
echo ============================================================
echo.
echo  Este script SIEMPRE reconstruye desde cero (--no-cache).
echo  Tarda mas pero garantiza que la imagen incluye TODOS tus
echo  cambios mas recientes en frontend y backend.
echo.
echo ============================================================
echo.

REM ---- 1. Verifica Docker Desktop ------------------------------------
echo [1/7] Verificando Docker Desktop...
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
echo [2/7] Verificando archivos del proyecto...
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
    echo  ^>^> No puedo continuar sin estos archivos. Restauralos antes de ejecutar.
    echo.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 3. Para el contenedor local si esta corriendo -----------------
echo [3/7] Deteniendo contenedor local previo (si existe)...
docker compose -f docker-compose.allinone.yml down >nul 2>&1
echo        OK
echo.

REM ---- 4. Build de la imagen SIN cache -------------------------------
echo [4/7] Construyendo imagen Docker desde cero (puede tardar 10-15 min)...
docker compose -f docker-compose.allinone.yml build --no-cache
if errorlevel 1 (
    echo.
    echo [ERROR] Fallo el build de Docker.
    echo         Si el error es de red ^(timeout / 504 de docker.io^), reintenta
    echo         en unos minutos: Docker Hub a veces da fallas transitorias.
    pause
    exit /b 1
)
echo        OK
echo.

REM ---- 5. Resolver carpeta destino del kit ---------------------------
REM Por defecto: Escritorio del usuario. Override con argumento: crearimagen.bat C:\ruta\custom
if "%~1"=="" (
    for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"') do set DESKTOP=%%i
    set KIT_DIR=!DESKTOP!\hotel-allinone-kit
) else (
    set KIT_DIR=%~1
)

echo [5/7] Preparando carpeta del kit: !KIT_DIR!
if not exist "!KIT_DIR!" (
    mkdir "!KIT_DIR!"
    if errorlevel 1 (
        echo [ERROR] No se pudo crear la carpeta del kit.
        pause
        exit /b 1
    )
)
echo        OK
echo.

REM ---- 6. Exportar imagen y copiar archivos al kit -------------------
echo [6/7] Exportando imagen y copiando archivos al kit...
echo        (esto tarda 1-2 min)

set KIT_ERRORS=0

REM Imagen .tar — borra el anterior solo despues de exportar OK al temporal
echo        - hotel-allinone.tar (imagen Docker, ~86 MB)
docker save hotel_sjg-hotel:latest -o "!KIT_DIR!\hotel-allinone.tar.new"
if errorlevel 1 (
    echo          [ERROR] Fallo docker save
    if exist "!KIT_DIR!\hotel-allinone.tar.new" del /f /q "!KIT_DIR!\hotel-allinone.tar.new"
    set KIT_ERRORS=1
) else (
    if exist "!KIT_DIR!\hotel-allinone.tar" del /f /q "!KIT_DIR!\hotel-allinone.tar"
    ren "!KIT_DIR!\hotel-allinone.tar.new" "hotel-allinone.tar"
    echo          OK
)

REM Demas archivos del kit — copia con verificacion individual
call :copy_file "docker\kit\docker-compose.allinone.yml" "!KIT_DIR!\docker-compose.allinone.yml"
call :copy_file ".env"                                    "!KIT_DIR!\.env"
call :copy_file "docker\kit\instalar.bat"                 "!KIT_DIR!\instalar.bat"
call :copy_file "docker\kit\LEEME.txt"                    "!KIT_DIR!\LEEME.txt"

echo.
if !KIT_ERRORS! equ 1 (
    echo [ERROR] Faltaron archivos. Revisa los mensajes arriba.
    pause
    exit /b 1
)
echo        OK - todos los archivos copiados
echo.

REM ---- 7. Levanta el contenedor local con la imagen nueva ------------
echo [7/7] Levantando contenedor local con la imagen recien creada...
docker rm -f hotel_all >nul 2>&1
docker compose -f docker-compose.allinone.yml up -d
if errorlevel 1 (
    echo [AVISO] Fallo al levantar el contenedor local, pero el kit ya esta listo.
    echo         Puedes levantarlo manualmente con:
    echo             docker compose -f docker-compose.allinone.yml up -d
    goto resumen
)
echo        OK
echo        Esperando a que Postgres + migraciones + seeders terminen...
set /a contador=0
:wait_local
timeout /t 3 /nobreak >nul
set /a contador+=3
curl -s -o nul -w "%%{http_code}" http://localhost/up > "%TEMP%\hotel_check.txt" 2>nul
set /p http_code=<"%TEMP%\hotel_check.txt"
del "%TEMP%\hotel_check.txt" 2>nul
if "!http_code!"=="200" goto local_ready
if !contador! geq 90 goto local_timeout
echo        ... esperando (!contador! seg)
goto wait_local

:local_timeout
echo [AVISO] El backend no respondio en 90 seg, pero el kit esta listo.
echo         Revisa: docker compose -f docker-compose.allinone.yml logs -f
goto resumen

:local_ready
echo        Backend respondiendo OK en http://localhost
echo.
echo        Verificando superusuarios en la base de datos...
docker exec hotel_all su-exec postgres psql -U hotel_user -d hotel_sjg -t -c "SELECT email FROM users WHERE email IN ('superadmin@hotelsjg.com','hantbedk@gmail.com');" 2>nul > "%TEMP%\hotel_users.txt"
findstr /C:"superadmin@hotelsjg.com" "%TEMP%\hotel_users.txt" >nul && findstr /C:"hantbedk@gmail.com" "%TEMP%\hotel_users.txt" >nul
if errorlevel 1 (
    echo        [AVISO] No encontre los 2 superusers en la BD local.
    echo                Esto puede pasar si tu volumen Postgres local es viejo.
    echo                En el PC destino con instalacion limpia se crearan OK.
) else (
    echo        OK - superusers cargados:
    echo                superadmin@hotelsjg.com / Hotel2024!
    echo                hantbedk@gmail.com      / 199412=Hbm
)
del "%TEMP%\hotel_users.txt" 2>nul

:resumen
echo.

REM ---- Resumen final --------------------------------------------------
echo ============================================================
echo   Kit generado en:
echo     !KIT_DIR!
echo ============================================================
echo.
echo   Contenido:
for %%F in ("!KIT_DIR!\*") do (
    for %%S in ("%%F") do echo     %%~nxF  ^(%%~zS bytes^)
)
echo.
echo   Para distribuirlo a otro PC:
echo     1. Copia TODA esta carpeta al PC destino.
echo     2. Doble click en instalar.bat (necesita Docker Desktop corriendo).
echo.
echo   IMPORTANTE: Si tu navegador muestra una version vieja, haz Ctrl+F5
echo   para forzar refresh y descartar el index.html cacheado.
echo.
pause
endlocal
exit /b 0

REM ====================================================================
REM Sub-rutina: copia un archivo y verifica que llego
REM Uso: call :copy_file "origen" "destino"
REM ====================================================================
:copy_file
echo        - %~nx2
copy /Y %1 %2 >nul
if errorlevel 1 (
    echo          [ERROR] No se pudo copiar %~1
    set KIT_ERRORS=1
    goto :eof
)
if not exist %2 (
    echo          [ERROR] El destino no existe tras copiar: %~2
    set KIT_ERRORS=1
    goto :eof
)
echo          OK
goto :eof
