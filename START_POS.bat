@echo off
REM ZSE POS System - Production Start
REM This script starts the built application

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo ZSE POS System v1.0.0
echo ========================================
echo.

REM Check if app is already built
if not exist "dist\index.html" (
    echo ERROR: Application not built
    echo Please run: npm run build-win or npm run build-win32
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)

echo Starting ZSE POS System...
echo.

REM Start Electron in production mode
set NODE_ENV=production
call npm start

if errorlevel 1 (
    echo ERROR: Application failed to start
    echo Check that you have Node.js installed
    pause
    exit /b 1
)

pause
