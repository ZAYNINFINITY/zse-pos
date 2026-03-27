# ZSE POS System - Build All Installers (Standalone Desktop App)
# PowerShell version
# Run: .\build-installers.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ZSE POS - Build Installers" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "This will create:" -ForegroundColor Yellow
Write-Host "  - ZSE-POS-System-1.0.0.exe (64-bit installer)" -ForegroundColor White
Write-Host "  - ZSE-POS-System-1.0.0-ia32.exe (32-bit installer)" -ForegroundColor White
Write-Host "  - Portable versions for USB" -ForegroundColor White
Write-Host ""

# Step 1
Write-Host "[Step 1/5] Cleaning previous builds..." -ForegroundColor Cyan
If (Test-Path dist) { Remove-Item -Recurse -Force dist | Out-Null }
If (Test-Path build) { Remove-Item -Recurse -Force build | Out-Null }
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

# Step 2
Write-Host "[Step 2/5] Installing dependencies..." -ForegroundColor Cyan
Write-Host "(This may take 2-5 minutes on first run)" -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    Write-Host "Try: npm install --legacy-peer-deps" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

# Step 3
Write-Host "[Step 3/5] Installing dependencies..." -ForegroundColor Cyan
Write-Host "(electron-builder will optimize native modules)" -ForegroundColor Yellow
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 4/5] Creating 64-bit installer (includes Vite build)..." -ForegroundColor Cyan
npm run build-win
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: 64-bit build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[Step 5/5] Creating 32-bit installer (includes Vite build)..." -ForegroundColor Cyan
npm run build-win32
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: 32-bit build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "BUILD COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your installers are ready in: dist-app\" -ForegroundColor Yellow
Write-Host ""
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "  - ZSE-POS-System-1.0.0.exe (64-bit, ~180 MB)" -ForegroundColor Green
Write-Host "  - ZSE-POS-System-1.0.0-ia32.exe (32-bit, ~160 MB)" -ForegroundColor Green
Write-Host "  - ZSE-POS-System 1.0.0.exe (portable 64-bit)" -ForegroundColor Green
Write-Host "  - ZSE-POS-System 1.0.0-ia32.exe (portable 32-bit)" -ForegroundColor Green
Write-Host ""
Write-Host "Ready to distribute!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
