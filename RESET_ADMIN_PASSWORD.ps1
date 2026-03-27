$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath $PSScriptRoot

Write-Host ""
Write-Host "========================================"
Write-Host "Reset POS Admin Password"
Write-Host "========================================"
Write-Host ""
Write-Host "NOTE:"
Write-Host "- Close the POS app before continuing."
Write-Host "- This will NOT delete your data."
Write-Host ""

$username = Read-Host "Enter username to reset (default: admin)"
if ([string]::IsNullOrWhiteSpace($username)) { $username = 'admin' }

$secure = Read-Host "Enter NEW password (min 6 chars, 1 uppercase, 1 number)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $newPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($newPassword)) {
  throw "Password cannot be empty."
}

Write-Host ""
Write-Host "Resetting password for '$username'..."

$newPassword | node "tools/reset-admin-password.js" --username "$username"
if ($LASTEXITCODE -ne 0) {
  throw "Reset failed."
}

Write-Host ""
Write-Host "Done. You can now start the POS and login."
