@echo off
REM ZSE POS System - One-Click Clean Setup
REM Handles all dependency installation issues automatically

setlocal enabledelayedexpansion
cd /d "%~dp0"

title ZSE POS System - Setup Script

echo.
echo ========================================
echo ZSE POS System - Clean Setup
echo ========================================
echo.
echo This script will:
echo   1. Remove old/corrupt dependencies
echo   2. Clean npm cache
echo   3. Install fresh dependencies
echo   4. Verify installation
echo.

set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo [Step 1/4] Removing old node_modules...
if exist node_modules (
    rmdir /S /Q node_modules >nul 2>&1
    timeout /t 2 >nul
)
if exist package-lock.json del /Q package-lock.json >nul 2>&1
echo Done!

echo.
echo [Step 2/4] Cleaning npm cache...
call npm cache clean --force >nul 2>&1
echo Done!

echo.
echo [Step 3/4] Installing fresh dependencies...
echo (This may take 5-10 minutes)
echo.
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo.
    echo ERROR: Installation failed
    echo Try these manual fixes:
    echo   1. npm cache clean --force
    echo   2. npm install --legacy-peer-deps
    pause
    exit /b 1
)
echo Done!

echo.
echo [Step 4/4] Verifying installation...
if not exist node_modules (
    echo ERROR: node_modules not created
    pause
    exit /b 1
)
if not exist node_modules\electron (
    echo ERROR: Electron not installed
    pause
    exit /b 1
)
if not exist node_modules\react (
    echo ERROR: React not installed
    pause
    exit /b 1
)
echo Done!

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo You can now run:
echo   - START_POS.bat (development mode)
echo   - build-installers.bat (create installers)
echo.

pause