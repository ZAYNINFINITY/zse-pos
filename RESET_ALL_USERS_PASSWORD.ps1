$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath $PSScriptRoot

Write-Host ""
Write-Host "========================================"
Write-Host "Reset ALL Users Passwords"
Write-Host "========================================"
Write-Host ""
Write-Host "NOTE:"
Write-Host "- Close the POS app before continuing."
Write-Host "- This will reset the password for every user in the database."
Write-Host "- This will NOT delete your data."
Write-Host ""

$secure = Read-Host "Enter NEW password for ALL users (min 6 chars, 1 uppercase, 1 number)" -AsSecureString
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
Write-Host "Resetting passwords for all users..."

$newPassword | node "tools/reset-all-users-passwords.js"
if ($LASTEXITCODE -ne 0) {
  throw "Reset failed."
}

Write-Host ""
Write-Host "Done. You can now start the POS and login with the new password."

