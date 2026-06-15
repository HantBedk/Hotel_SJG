@rem Hotel Manager — Docker local
@rem Uso: scripts\docker-local.cmd [up|dev|down|logs|reset|status]
@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0docker-local.ps1" %*
exit /b %ERRORLEVEL%
