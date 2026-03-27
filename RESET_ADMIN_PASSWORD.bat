@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0RESET_ADMIN_PASSWORD.ps1"
pause
