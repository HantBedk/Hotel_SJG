@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-frontend-windows.ps1"
if errorlevel 1 exit /b 1
echo Listo. Prueba: cd frontend ^&^& node node_modules\vite\bin\vite.js
