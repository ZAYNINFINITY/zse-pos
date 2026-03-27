@echo off
REM ZSE POS System - Build Installers
REM Creates 64-bit and 32-bit Windows installers for distribution
REM Updated: February 18, 2026

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo ZSE POS System v1.0.0 - Build Installers
echo ========================================
echo.
echo This will create:
echo   - ZSE POS System Setup 1.0.0.exe (64-bit NSIS installer)
echo   - ZSE POS System 1.0.0 Win32.exe (32-bit NSIS installer)
echo   - Portable .exe versions for both architectures
echo.
echo System Requirements:
echo   - Node.js v18.20.8 or later
echo   - npm 9.x or later
echo   - 2GB+ disk space available
echo.

REM Step 1: Clean previous builds
echo [Step 1/4] Cleaning previous builds...
if exist dist rmdir /S /Q dist >nul 2>&1
if exist dist-app rmdir /S /Q dist-app >nul 2>&1
if exist build rmdir /S /Q build >nul 2>&1
echo ✓ Cleaned
echo.

REM Step 2: Install/verify dependencies
echo [Step 2/4] Verifying dependencies...
if not exist node_modules (
    echo Installing npm packages (may take 3-5 minutes)...
    call npm install
    if errorlevel 1 (
        echo ✗ ERROR: npm install failed
        echo Try: npm install --legacy-peer-deps
        pause
        exit /b 1
    )
) else (
    echo ✓ Dependencies already installed
)
echo.

REM Step 3: Build 64-bit installer
echo [Step 3/4] Building 64-bit installer...
echo (Building Vite bundle + creating NSIS installer, this  takes 2-3 minutes)
call npm run build-win
if errorlevel 1 (
    echo ✗ ERROR: 64-bit build failed
    echo Check internet connection and disk space
    pause
    exit /b 1
)
echo ✓ 64-bit installer created
echo.

REM Step 4: Build 32-bit installer
echo [Step 4/4] Building 32-bit installer...
call npm run build-win32
if errorlevel 1 (
    echo ✗ ERROR: 32-bit build failed
    pause
    exit /b 1
)
echo ✓ 32-bit installer created
echo.

REM Completion
echo ========================================
echo ✓ BUILD COMPLETE
echo ========================================
echo.
echo Installers created in: dist-app\
echo.
echo Files:
echo   ✓ ZSE POS System Setup 1.0.0.exe (64-bit)
echo   ✓ ZSE POS System 1.0.0 Win32.exe (32-bit)
echo.
echo You can now:
echo   1. Install on your system
echo   2. Test the application
echo   3. Distribute to customers
echo.
echo Documentation: See FINAL_STATUS_REPORT.md
echo Integration: See COMPREHENSIVE_TESTING_WHATSAPP_BOT.md
echo.
pause
